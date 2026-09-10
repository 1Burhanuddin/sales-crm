import { supabaseAdmin } from "./supabaseAdmin.ts";

const FOLDER_NAME = "Quixsyn CRM Attachments";
// Refresh a bit before Google's real ~1h expiry so a request never
// races a token that's about to die mid-call.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "",
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error("googleDrive.refresh_error", data);
    throw new Error("Failed to refresh Google access token");
  }
  return { accessToken: data.access_token as string, expiresIn: data.expires_in as number };
}

async function driveFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });
  return res;
}

async function findOrCreateFolder(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const searchRes = await driveFetch(`files?q=${q}&fields=files(id)`, accessToken);
  const searchData = await searchRes.json();
  if (searchRes.ok && searchData.files?.length) {
    return searchData.files[0].id;
  }

  const createRes = await driveFetch("files", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    console.error("googleDrive.create_folder_error", createData);
    throw new Error("Failed to create Drive folder");
  }
  return createData.id;
}

/** A ready-to-use access token and the (found-or-created, cached)
 * attachments folder id. Throws if Drive isn't connected yet. */
export async function getDriveContext() {
  const { data, error } = await supabaseAdmin
    .from("oauth_tokens")
    .select("refresh_token, drive_folder_id, access_token, access_token_expires_at")
    .eq("provider", "google_drive")
    .single();

  if (error || !data) {
    throw new Error("Google Drive is not connected");
  }

  let accessToken = data.access_token as string | null;
  const stillValid =
    accessToken &&
    data.access_token_expires_at &&
    new Date(data.access_token_expires_at).getTime() - EXPIRY_SAFETY_MARGIN_MS > Date.now();

  if (!stillValid) {
    const refreshed = await refreshAccessToken(data.refresh_token);
    accessToken = refreshed.accessToken;
    const { error: cacheError } = await supabaseAdmin
      .from("oauth_tokens")
      .update({
        access_token: accessToken,
        access_token_expires_at: new Date(
          Date.now() + refreshed.expiresIn * 1000,
        ).toISOString(),
      })
      .eq("provider", "google_drive");
    if (cacheError) {
      console.error("googleDrive.cache_access_token_error", cacheError);
    }
  }

  if (data.drive_folder_id) {
    return { accessToken: accessToken as string, folderId: data.drive_folder_id as string };
  }

  const folderId = await findOrCreateFolder(accessToken as string);
  const { error: folderCacheError } = await supabaseAdmin
    .from("oauth_tokens")
    .update({ drive_folder_id: folderId })
    .eq("provider", "google_drive");
  if (folderCacheError) {
    console.error("googleDrive.cache_folder_id_error", folderCacheError);
  }

  return { accessToken: accessToken as string, folderId };
}
