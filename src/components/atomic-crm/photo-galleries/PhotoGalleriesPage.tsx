import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useCreate, useGetList, useGetOne, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import type { Photographer, PhotographerStorageUsage, PhotoGallery } from "../types";
import { FolderPagination } from "./FolderPagination";
import { formatBytes } from "./formatBytes";

const GALLERIES_PER_PAGE = 20;

function randomToken() {
  // 24 random bytes, base64url -- unguessable, URL-safe.
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const PhotoGalleriesPage = () => {
  const { photographerId } = useParams();
  const translate = useTranslate();
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const { data: photographer } = useGetOne<Photographer>("photographers", { id: photographerId });
  const { data: usage } = useGetOne<PhotographerStorageUsage>(
    "photographer_storage_usage",
    { id: photographerId },
    { enabled: !!photographerId },
  );
  const {
    data: galleries,
    total: galleryTotal,
    isPending,
    refetch,
  } = useGetList<PhotoGallery>("photo_galleries", {
    pagination: { page, perPage: GALLERIES_PER_PAGE },
    sort: { field: "created_at", order: "DESC" },
    filter: { photographer_id: photographerId },
  });
  const [create, { isPending: isCreating }] = useCreate();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !photographerId) return;
    create(
      "photo_galleries",
      {
        data: {
          name: name.trim(),
          client_name: clientName.trim() || null,
          share_token: randomToken(),
          photographer_id: photographerId,
        },
      },
      {
        onSuccess: () => {
          setName("");
          setClientName("");
          refetch();
        },
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8 max-w-3xl">
      <div>
        <Link to="/photographers" className="text-sm text-primary hover:underline">
          {translate("crm.photo_galleries.photographers", { _: "Photographers" })}
        </Link>
        <h1 className="text-xl font-semibold">{photographer?.name}</h1>
        {usage && (
          <p className="text-sm text-muted-foreground">
            {translate("crm.photo_galleries.storage_used", {
              _: `${formatBytes(usage.total_bytes)} used across ${usage.photo_count} photos`,
              size: formatBytes(usage.total_bytes),
              count: usage.photo_count,
            })}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {translate("crm.photo_galleries.new", { _: "New gallery" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{translate("crm.photo_galleries.name", { _: "Gallery name" })}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma Wedding" />
            </div>
            <div className="space-y-1">
              <Label>{translate("crm.photo_galleries.client_name", { _: "Client name" })}</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleCreate} disabled={!name.trim() || isCreating}>
              <Plus className="size-4 mr-1" />
              {translate("crm.photo_galleries.create", { _: "Create gallery" })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="flex flex-col gap-2">
          {(galleries ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {translate("crm.photo_galleries.empty", { _: "No galleries yet" })}
            </p>
          )}
          {(galleries ?? []).map((g) => (
            <Link key={g.id} to={`/photo-galleries/${g.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    {g.client_name && (
                      <p className="text-sm text-muted-foreground">{g.client_name}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(g.created_at), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          <FolderPagination
            page={page}
            perPage={GALLERIES_PER_PAGE}
            total={galleryTotal ?? 0}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
