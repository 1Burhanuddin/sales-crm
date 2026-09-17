import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { deleteDriveFile, getDriveContext } from "../_shared/googleDrive.ts";

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Two modes on one POST endpoint (JSON body vs. multipart), so the
// existence check doesn't need its own CORS method allow-listed.
async function checkExists(fileId: string) {
  const { accessToken } = await getDriveContext();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  // Only a real 404 means "gone". Any other failure (network blip,
  // rate limit, revoked token) is inconclusive -- surface it as an
  // error rather than claiming exists:false, so the caller doesn't
  // treat "Drive had a hiccup" as "re-upload this".
  if (res.ok) return jsonResponse({ exists: true });
  if (res.status === 404) return jsonResponse({ exists: false });
  console.error("google_drive_upload.check_exists_error", await res.text());
  return createErrorResponse(502, "Could not check Google Drive");
}

async function deleteFile(fileId: string) {
  const { accessToken } = await getDriveContext();
  await deleteDriveFile(accessToken, fileId);
  return jsonResponse({ deleted: true });
}

async function upload(file: File, parentFolderId: string | null) {
  const { accessToken, folderId } = await getDriveContext();

  const metadata = { name: file.name || "attachment", parents: [parentFolderId ?? folderId] };
  const boundary = `quixsyncrm${crypto.randomUUID()}`;
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, file, tail]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.id) {
    console.error("google_drive_upload.upload_error", uploadData);
    return createErrorResponse(500, "Failed to upload to Google Drive");
  }

  // Viewable by anyone with the link -- same exposure level the public
  // Supabase Storage bucket this replaces already had. A failure here
  // means the file is uploaded but not actually viewable by anyone but
  // the connected account, so fail the whole request rather than
  // silently returning a link that 403s for every other viewer.
  const permRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    },
  );
  if (!permRes.ok) {
    console.error("google_drive_upload.permission_error", await permRes.json());
    return createErrorResponse(500, "Uploaded but failed to make it viewable");
  }

  return jsonResponse({
    fileId: uploadData.id,
    // drive.google.com/thumbnail, not lh3.googleusercontent.com/d/ --
    // the lh3 form intermittently 403s for freshly-uploaded files
    // (it expects the file to have been "warmed up" by viewing it in
    // Drive's own UI first). The thumbnail endpoint works immediately
    // for any "anyone with the link" file, no warm-up needed.
    src: `https://drive.google.com/thumbnail?id=${uploadData.id}&sz=w1000`,
    mimeType: uploadData.mimeType,
    // Drive returns size as a string; null for Google-native doc types
    // that don't apply here (we only ever upload real photo files).
    sizeBytes: uploadData.size ? Number(uploadData.size) : null,
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
          const contentType = req.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const { checkFileId, deleteFileId } = await req.json();
            if (deleteFileId) {
              return await deleteFile(deleteFileId);
            }
            if (!checkFileId) {
              return createErrorResponse(400, "Missing checkFileId");
            }
            return await checkExists(checkFileId);
          }

          const formData = await req.formData();
          const file = formData.get("file");
          if (!(file instanceof File)) {
            return createErrorResponse(400, "Missing file");
          }
          const parentFolderId = formData.get("parentFolderId");
          return await upload(file, typeof parentFolderId === "string" ? parentFolderId : null);
        } catch (err) {
          console.error("google_drive_upload.error", err);
          return createErrorResponse(500, err?.toString() || "Internal Server Error");
        }
      }),
    ),
  ),
);
