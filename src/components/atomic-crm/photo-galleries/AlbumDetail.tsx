import { AlertCircle, Loader2, Trash2, Upload } from "lucide-react";
import {
  useDataProvider,
  useDelete,
  useGetList,
  useGetOne,
  useNotify,
  useTranslate,
} from "ra-core";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getSupabaseClient } from "../providers/supabase/supabase";
import type { GalleryAlbum, GalleryPhoto } from "../types";
import { FolderPagination } from "./FolderPagination";
import { PhotoLightbox } from "./PhotoLightbox";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const MAX_UPLOAD_RETRIES = 3;
const PHOTOS_PER_PAGE = 60;

type UploadItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "error";
  retries: number;
};

export const AlbumDetail = () => {
  const { id } = useParams();
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drive images are streamed through gallery_photo (see that function's
  // comment) rather than hotlinked -- an <img> tag can't attach an
  // Authorization header, so the session's access token has to travel
  // as a query param instead.
  const [accessToken, setAccessToken] = useState<string | null>(null);
  useEffect(() => {
    getSupabaseClient()
      .auth.getSession()
      .then(({ data }) => setAccessToken(data.session?.access_token ?? null));
  }, []);
  const photoSrc = (photoId: GalleryPhoto["id"]) =>
    `${SUPABASE_URL}/functions/v1/gallery_photo?id=${photoId}&access_token=${accessToken}`;

  // Source of truth is this ref, not the mirrored `queue` state -- the
  // sequential processor below reads it synchronously between awaits,
  // which plain useState (batched, stale-closure-prone in a loop)
  // can't give us. `queue` only exists so the JSX below has something
  // to render off of.
  const queueRef = useRef<UploadItem[]>([]);
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const processingRef = useRef(false);
  const parentFolderIdRef = useRef<string | null>(null);
  // How many files this upload batch started with / has finished, so
  // the collapsed progress row can show "2 of 5" -- queue itself only
  // holds what's still pending/uploading/failed, not what's already
  // succeeded and been removed.
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchDone, setBatchDone] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  const setQueueItems = (items: UploadItem[]) => {
    queueRef.current = items;
    setQueue(items);
  };
  const patchItem = (itemId: string, patch: Partial<UploadItem>) => {
    setQueueItems(queueRef.current.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));
  };
  const removeItem = (itemId: string) => {
    setQueueItems(queueRef.current.filter((i) => i.id !== itemId));
  };

  const { data: album, isPending: albumPending } = useGetOne<GalleryAlbum>("gallery_albums", { id });
  const [page, setPage] = useState(1);
  const {
    data: photos,
    total: photoTotal,
    isPending: photosPending,
    refetch,
  } = useGetList<GalleryPhoto>("gallery_photos", {
    pagination: { page, perPage: PHOTOS_PER_PAGE },
    sort: { field: "created_at", order: "ASC" },
    filter: { album_id: id },
  });
  const [deleteOne] = useDelete();

  // Resolved once per album (not once per file/batch) and cached both
  // here and server-side (gallery_albums.drive_folder_id) -- repeat
  // uploads, including retries, skip the Drive lookup.
  const resolveFolderId = async (): Promise<string> => {
    if (parentFolderIdRef.current) return parentFolderIdRef.current;
    if (!album) throw new Error("no album");
    const { data: folderData, error: folderError } = await getSupabaseClient().functions.invoke<{
      data: { folderId: string };
    }>("ensure_album_folder", { body: { albumId: album.id } });
    if (folderError || !folderData?.data) {
      throw new Error("folder");
    }
    parentFolderIdRef.current = folderData.data.folderId;
    return parentFolderIdRef.current;
  };

  const uploadOne = async (item: UploadItem) => {
    if (!album) return;
    patchItem(item.id, { status: "uploading" });
    try {
      const parentFolderId = await resolveFolderId();

      const formData = new FormData();
      formData.append("file", item.file, item.file.name);
      formData.append("parentFolderId", parentFolderId);
      const { data, error } = await getSupabaseClient().functions.invoke<{
        data: { fileId: string; src: string; mimeType: string; sizeBytes: number | null };
      }>("google_drive_upload", { body: formData });
      if (error || !data?.data) throw new Error("upload");

      await dataProvider.create("gallery_photos", {
        data: {
          album_id: album.id,
          drive_file_id: data.data.fileId,
          src: data.data.src,
          mime_type: data.data.mimeType,
          size_bytes: data.data.sizeBytes,
          filename: item.file.name,
        },
      });

      removeItem(item.id);
      setBatchDone((d) => d + 1);
      refetch();
    } catch (err) {
      console.error("gallery upload error", err);
      patchItem(item.id, { status: "error" });
    }
  };

  // One file in flight at a time: this way the UI can always show
  // exactly which photo is currently uploading, and a slow/large file
  // never has N-1 others silently racing it in the background.
  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      let next = queueRef.current.find((i) => i.status === "pending");
      while (next) {
        await uploadOne(next);
        next = queueRef.current.find((i) => i.status === "pending");
      }
    } finally {
      processingRef.current = false;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !album) return;
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
      retries: 0,
    }));
    const startingFresh = queueRef.current.filter((i) => i.status !== "error").length === 0;
    setBatchTotal((t) => (startingFresh ? newItems.length : t + newItems.length));
    if (startingFresh) setBatchDone(0);
    setQueueItems([...queueRef.current, ...newItems]);
    processQueue();
  };

  const handleRetry = (item: UploadItem) => {
    if (item.retries >= MAX_UPLOAD_RETRIES) return;
    patchItem(item.id, { status: "pending", retries: item.retries + 1 });
    processQueue();
  };

  const activeItems = queue.filter((i) => i.status !== "error");
  const errorItems = queue.filter((i) => i.status === "error");
  const uploadingItem = queue.find((i) => i.status === "uploading");
  const isUploading = activeItems.length > 0;

  const handleDelete = async (photo: GalleryPhoto) => {
    // Best-effort: if Drive deletion fails (network blip, already
    // gone), still remove the CRM-side record rather than leaving a
    // photo the team can no longer manage stuck visible.
    try {
      await getSupabaseClient().functions.invoke("google_drive_upload", {
        body: { deleteFileId: photo.drive_file_id },
      });
    } catch (err) {
      console.error("gallery drive delete error", err);
    }
    deleteOne(
      "gallery_photos",
      { id: photo.id },
      { onSuccess: () => refetch(), onError: () => notify("ra.notification.http_error", { type: "error" }) },
    );
  };

  if (albumPending) return <Skeleton className="h-64 w-full" />;
  if (!album) return null;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      <div>
        <Link to={`/photo-galleries/${album.gallery_id}`} className="text-sm text-primary hover:underline">
          {translate("crm.photo_galleries.back_to_gallery", { _: "Back to gallery" })}
        </Link>
        <h1 className="text-xl font-semibold">{album.name}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            {translate("crm.photo_galleries.photos", { _: "Photos" })}
          </CardTitle>
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Upload className="size-4 mr-1" />
            {isUploading
              ? translate("crm.photo_galleries.uploading", { _: "Uploading..." })
              : translate("crm.photo_galleries.upload", { _: "Upload photos" })}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </CardHeader>
        <CardContent>
          {(activeItems.length > 0 || errorItems.length > 0) && (
            <ul className="mb-3 flex flex-col gap-1.5">
              {activeItems.length > 0 && (
                <li className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm">
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {translate("crm.photo_galleries.queue_progress", {
                      _: `Uploading ${uploadingItem?.file.name ?? ""} (${Math.min(batchDone + 1, batchTotal)} of ${batchTotal})`,
                      filename: uploadingItem?.file.name ?? "",
                      current: Math.min(batchDone + 1, batchTotal),
                      total: batchTotal,
                    })}
                  </span>
                </li>
              )}
              {errorItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm"
                >
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                  <span className="flex-1 truncate">
                    {translate("crm.photo_galleries.queue_error", {
                      _: `Failed: ${item.file.name}`,
                      filename: item.file.name,
                    })}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={item.retries >= MAX_UPLOAD_RETRIES}
                    onClick={() => handleRetry(item)}
                  >
                    {item.retries >= MAX_UPLOAD_RETRIES
                      ? translate("crm.photo_galleries.queue_retry_limit", { _: "Retry limit reached" })
                      : translate("crm.photo_galleries.queue_retry", { _: "Retry" })}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {photosPending ? (
            <Skeleton className="h-40 w-full" />
          ) : (photos ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.photo_galleries.no_photos", { _: "No photos yet" })}
            </p>
          ) : !accessToken ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {(photos ?? []).map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-md overflow-hidden border">
                  <img
                    src={photoSrc(photo.id)}
                    alt={photo.filename ?? ""}
                    className="w-full h-full object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => setLightboxPhoto(photo)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={translate("ra.action.delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <FolderPagination
            page={page}
            perPage={PHOTOS_PER_PAGE}
            total={photoTotal ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
      {lightboxPhoto && (
        <PhotoLightbox
          src={photoSrc(lightboxPhoto.id)}
          alt={lightboxPhoto.filename}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
};
