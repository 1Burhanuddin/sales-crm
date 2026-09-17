import { Check, Copy, Plus } from "lucide-react";
import { useCreate, useGetList, useGetOne, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import type { GalleryAlbum, PhotoGallery } from "../types";
import { FolderPagination } from "./FolderPagination";

const ALBUMS_PER_PAGE = 20;

// A client gallery's albums (e.g. "Outdoor"/"Indoor" folders) -- the
// actual photo upload/grid UI lives one level down, in AlbumDetail.
export const PhotoGalleryDetail = () => {
  const { id } = useParams();
  const translate = useTranslate();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);

  const { data: gallery, isPending: galleryPending } = useGetOne<PhotoGallery>("photo_galleries", { id });
  const {
    data: albums,
    total: albumTotal,
    isPending: albumsPending,
    refetch,
  } = useGetList<GalleryAlbum>("gallery_albums", {
    pagination: { page, perPage: ALBUMS_PER_PAGE },
    sort: { field: "created_at", order: "ASC" },
    filter: { gallery_id: id },
  });
  const [create, { isPending: isCreating }] = useCreate();

  const shareUrl = gallery
    ? `${window.location.origin}${window.location.pathname}#/g/${gallery.share_token}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreate = () => {
    if (!name.trim() || !id) return;
    create(
      "gallery_albums",
      { data: { gallery_id: id, name: name.trim() } },
      {
        onSuccess: () => {
          setName("");
          refetch();
        },
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  if (galleryPending) return <Skeleton className="h-64 w-full" />;
  if (!gallery) return null;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8 max-w-3xl">
      <div>
        <Link to={`/photographers/${gallery.photographer_id}`} className="text-sm text-primary hover:underline">
          {translate("crm.photo_galleries.back_to_photographer", { _: "Back to photographer" })}
        </Link>
        <h1 className="text-xl font-semibold">{gallery.name}</h1>
        {gallery.client_name && <p className="text-muted-foreground">{gallery.client_name}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {translate("crm.photo_galleries.share_link", { _: "Share link" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-sm px-3 py-2 rounded-md border bg-muted"
              onFocus={(e) => e.target.select()}
            />
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {translate("crm.photo_galleries.share_link_hint", {
              _: "Anyone with this link can view these photos -- no login needed.",
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {translate("crm.photo_galleries.new_album", { _: "New album" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate("crm.photo_galleries.album_name", { _: "e.g. Outdoor, Indoor" })}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button type="button" onClick={handleCreate} disabled={!name.trim() || isCreating}>
              <Plus className="size-4 mr-1" />
              {translate("ra.action.create")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {albumsPending ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="flex flex-col gap-2">
          {(albums ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {translate("crm.photo_galleries.no_albums", { _: "No albums yet" })}
            </p>
          )}
          {(albums ?? []).map((album) => (
            <Link key={album.id} to={`/albums/${album.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="py-3">
                  <p className="font-medium">{album.name}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          <FolderPagination
            page={page}
            perPage={ALBUMS_PER_PAGE}
            total={albumTotal ?? 0}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
