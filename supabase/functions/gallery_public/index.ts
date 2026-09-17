import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

// Public, unauthenticated (verify_jwt=false, see config.toml) --
// deliberately so: this is the client-facing side of a photo gallery
// share link. The exact share_token IS the access control (same trust
// model as any "anyone with the link" share) -- there is no listing,
// no way to enumerate other clients' galleries, just a lookup of the
// one row matching the token you already have.
async function getGallery(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return createErrorResponse(400, "Missing token");
  }

  const { data: gallery, error: galleryError } = await supabaseAdmin
    .from("photo_galleries")
    .select("id, name, client_name")
    .eq("share_token", token)
    .maybeSingle();

  if (galleryError) {
    console.error("gallery_public.gallery_error", galleryError);
    return createErrorResponse(500, "Failed to load gallery");
  }
  if (!gallery) {
    return createErrorResponse(404, "Gallery not found");
  }

  const { data: albums, error: albumsError } = await supabaseAdmin
    .from("gallery_albums")
    .select("id, name, gallery_photos(id, filename, mime_type, created_at)")
    .eq("gallery_id", gallery.id)
    .order("created_at", { ascending: true })
    .order("created_at", { ascending: true, foreignTable: "gallery_photos" });

  if (albumsError) {
    console.error("gallery_public.albums_error", albumsError);
    return createErrorResponse(500, "Failed to load albums");
  }

  return new Response(
    JSON.stringify({ data: { gallery, albums: albums ?? [] } }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) => {
    if (req.method !== "GET") {
      return createErrorResponse(405, "Method Not Allowed");
    }
    return getGallery(req);
  }),
);
