import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { findOrCreateChildFolder, getDriveContext } from "../_shared/googleDrive.ts";

// Resolves (and caches) the nested Drive folder for one album:
// <root attachments folder>/<photographer name>/<gallery name>/<album name>/
// Cached on photographers.drive_folder_id, photo_galleries.drive_folder_id
// and gallery_albums.drive_folder_id so this only ever hits the Drive API
// once per photographer/gallery/album, not on every upload.
async function ensureFolder(req: Request) {
  const { albumId } = await req.json();
  if (!albumId) return createErrorResponse(400, "albumId is required");

  const { data: album, error: albumError } = await supabaseAdmin
    .from("gallery_albums")
    .select(
      "id, name, drive_folder_id, photo_galleries(id, name, drive_folder_id, photographers(id, name, drive_folder_id))",
    )
    .eq("id", albumId)
    .single();
  if (albumError || !album) {
    return createErrorResponse(404, "Album not found");
  }

  const gallery = album.photo_galleries as
    | { id: number; name: string; drive_folder_id: string | null; photographers: { id: number; name: string; drive_folder_id: string | null } | null }
    | null;
  const photographer = gallery?.photographers ?? null;
  if (!gallery || !photographer) {
    return createErrorResponse(404, "Album has no gallery/photographer");
  }

  if (album.drive_folder_id) {
    return jsonResponse({ folderId: album.drive_folder_id });
  }

  const { accessToken, folderId: rootFolderId } = await getDriveContext();

  let photographerFolderId = photographer.drive_folder_id;
  if (!photographerFolderId) {
    photographerFolderId = await findOrCreateChildFolder(accessToken, rootFolderId, photographer.name);
    const { error } = await supabaseAdmin
      .from("photographers")
      .update({ drive_folder_id: photographerFolderId })
      .eq("id", photographer.id);
    if (error) console.error("ensure_album_folder.cache_photographer_error", error);
  }

  let galleryFolderId = gallery.drive_folder_id;
  if (!galleryFolderId) {
    galleryFolderId = await findOrCreateChildFolder(accessToken, photographerFolderId, gallery.name);
    const { error } = await supabaseAdmin
      .from("photo_galleries")
      .update({ drive_folder_id: galleryFolderId })
      .eq("id", gallery.id);
    if (error) console.error("ensure_album_folder.cache_gallery_error", error);
  }

  const albumFolderId = await findOrCreateChildFolder(accessToken, galleryFolderId, album.name);
  const { error: cacheError } = await supabaseAdmin
    .from("gallery_albums")
    .update({ drive_folder_id: albumFolderId })
    .eq("id", album.id);
  if (cacheError) console.error("ensure_album_folder.cache_album_error", cacheError);

  return jsonResponse({ folderId: albumFolderId });
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) =>
    AuthMiddleware(req, async (req) =>
      UserMiddleware(req, async (req) => {
        if (req.method !== "POST") {
          return createErrorResponse(405, "Method Not Allowed");
        }
        try {
          return await ensureFolder(req);
        } catch (err) {
          console.error("ensure_album_folder.error", err);
          return createErrorResponse(500, err instanceof Error ? err.message : "Failed to resolve folder");
        }
      }),
    ),
  ),
);
