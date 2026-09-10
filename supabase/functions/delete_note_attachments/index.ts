import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { AuthMiddleware } from "../_shared/authentication.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { getDriveContext } from "../_shared/googleDrive.ts";

type NoteAttachment = {
  path?: string | null;
};

type NoteRecord = {
  id?: number | string | null;
  attachments?: NoteAttachment[] | null;
};

type WebhookPayload = {
  type?: string | null;
  old_record?: NoteRecord | null;
  record?: NoteRecord | null;
};

// Attachments live in Google Drive now -- `path` on each attachment is
// the Drive file id (see google_drive_upload), not a storage path.
const deleteNoteAttachments = async (req: Request) => {
  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const payload = (await req.json()) as WebhookPayload;
  const fileIds = getFileIdsToDelete(payload);

  if (fileIds.length === 0) {
    return jsonResponse({ status: "skipped", reason: "no_paths_to_delete" });
  }

  try {
    const { accessToken } = await getDriveContext();
    await Promise.all(
      fileIds.map(async (fileId) => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
        );
        // 404 just means it's already gone -- fine either way.
        if (!res.ok && res.status !== 404) {
          throw new Error(`Drive delete failed: ${res.status}`);
        }
      }),
    );
  } catch (err) {
    console.error("Failed to delete note attachments", {
      type: payload.type ?? null,
      fileIds,
      error: err?.toString(),
    });
    return createErrorResponse(500, "Failed to delete note attachments");
  }

  return jsonResponse({ status: "ok" });
};

Deno.serve(async (req: Request) =>
  AuthMiddleware(req, async (req: Request) => deleteNoteAttachments(req)),
);

const getFileIdsToDelete = (payload: WebhookPayload): string[] => {
  const oldIds = extractFileIds(payload.old_record?.attachments);
  const newIds = extractFileIds(payload.record?.attachments);

  if (payload.type === "UPDATE") {
    const newIdsSet = new Set(newIds);
    return oldIds.filter((id) => !newIdsSet.has(id));
  }

  if (payload.type === "DELETE") {
    return oldIds;
  }

  return [];
};

const extractFileIds = (attachments?: NoteAttachment[] | null): string[] => {
  const ids = attachments
    ?.map((a) => a.path)
    .filter((id): id is string => !!id && id.length > 0);

  return ids ? Array.from(new Set(ids)) : [];
};

const jsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
