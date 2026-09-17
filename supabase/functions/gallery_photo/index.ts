import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { getDriveContext } from "../_shared/googleDrive.ts";

// Streams a gallery photo's actual bytes from Google Drive through our
// own backend, instead of hotlinking Drive's public "anyone with the
// link" URLs (lh3.googleusercontent.com/d/..., drive.google.com/thumbnail)
// directly from <img src>. Those consumer-facing endpoints are meant for
// occasional personal use and start 429-ing once a gallery page fires
// off several of them at once -- exactly the pattern a photo grid needs.
// Fetching with our own service-account Drive token has no such quota
// problem and keeps the file's Drive sharing settings irrelevant to
// whether it's viewable here.
//
// verify_jwt is off (see config.toml) because this single endpoint
// serves two very different callers that an <img> tag can't attach an
// Authorization header for -- both must arrive as plain query params:
//   - the public share page: ?id=<gallery_photos.id>&token=<share_token>
//     -- token must resolve to the gallery that actually owns this photo,
//     same trust model as gallery_public.
//   - the authenticated CRM page: ?id=<gallery_photos.id>&access_token=<jwt>
//     -- the row is fetched through a request-scoped client carrying that
//     JWT, so Postgres RLS (not this function) decides access.
async function servePhoto(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  const accessToken = url.searchParams.get("access_token");

  if (!id) {
    return createErrorResponse(400, "Missing id");
  }
  if (!token && !accessToken) {
    return createErrorResponse(400, "Missing token or access_token");
  }

  let photo: { drive_file_id: string; mime_type: string | null } | null = null;

  if (token) {
    const { data: gallery } = await supabaseAdmin
      .from("photo_galleries")
      .select("id")
      .eq("share_token", token)
      .maybeSingle();
    if (!gallery) {
      return createErrorResponse(404, "Not found");
    }
    const { data } = await supabaseAdmin
      .from("gallery_photos")
      .select("drive_file_id, mime_type, gallery_albums!inner(gallery_id)")
      .eq("id", id)
      .eq("gallery_albums.gallery_id", gallery.id)
      .maybeSingle();
    photo = data ?? null;
  } else {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SB_PUBLISHABLE_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
    );
    const { data } = await userClient
      .from("gallery_photos")
      .select("drive_file_id, mime_type")
      .eq("id", id)
      .maybeSingle();
    photo = data ?? null;
  }

  if (!photo) {
    return createErrorResponse(404, "Not found");
  }

  const { accessToken: driveAccessToken } = await getDriveContext();
  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${photo.drive_file_id}?alt=media`,
    { headers: { Authorization: `Bearer ${driveAccessToken}` } },
  );
  if (!driveRes.ok || !driveRes.body) {
    console.error("gallery_photo.drive_error", await driveRes.text());
    return createErrorResponse(502, "Could not load photo");
  }

  return new Response(driveRes.body, {
    headers: {
      "Content-Type": photo.mime_type || driveRes.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) => {
    if (req.method !== "GET") {
      return createErrorResponse(405, "Method Not Allowed");
    }
    try {
      return await servePhoto(req);
    } catch (err) {
      console.error("gallery_photo.error", err);
      return createErrorResponse(500, "Internal Server Error");
    }
  }),
);
