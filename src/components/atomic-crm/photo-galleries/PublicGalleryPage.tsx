import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { PhotoLightbox } from "./PhotoLightbox";

interface PublicPhoto {
  id: number;
  filename: string | null;
}

interface PublicAlbum {
  id: number;
  name: string;
  gallery_photos: PublicPhoto[];
}

interface PublicGalleryData {
  gallery: { id: number; name: string; client_name: string | null };
  albums: PublicAlbum[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/** The client-facing side of a gallery share link. Deliberately not
 * behind react-admin's auth/Layout at all -- this is meant to be
 * opened by someone with no CRM account, just the link. Fetches
 * straight from the public gallery_public edge function, never the
 * authenticated dataProvider. */
export const PublicGalleryPage = () => {
  const { token } = useParams();
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "ok"; data: PublicGalleryData }
  >({ status: "loading" });
  const [lightboxPhoto, setLightboxPhoto] = useState<PublicPhoto | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${SUPABASE_URL}/functions/v1/gallery_public?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body) => setState({ status: "ok", data: body.data }))
      .catch(() => setState({ status: "error" }));
  }, [token]);

  if (state.status === "loading") {
    return <PageShell>Loading…</PageShell>;
  }
  if (state.status === "error") {
    return (
      <PageShell>
        <p className="text-muted-foreground">
          This link isn't valid, or the gallery has been removed.
        </p>
      </PageShell>
    );
  }

  const { gallery, albums } = state.data;
  // Streamed through gallery_photo (see that function) rather than
  // hotlinked from Drive directly -- Drive's public hotlink endpoints
  // start 429-ing once a gallery grid fires off several at once.
  const photoUrl = (photoId: number) =>
    `${SUPABASE_URL}/functions/v1/gallery_photo?id=${photoId}&token=${encodeURIComponent(token ?? "")}`;
  const hasPhotos = albums.some((a) => a.gallery_photos.length > 0);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{gallery.name}</h1>
        {gallery.client_name && <p className="text-muted-foreground">{gallery.client_name}</p>}
      </div>
      {!hasPhotos ? (
        <p className="text-muted-foreground">No photos here yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {albums
            .filter((album) => album.gallery_photos.length > 0)
            .map((album) => (
              <div key={album.id}>
                <h2 className="text-lg font-medium mb-3">{album.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {album.gallery_photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="aspect-square rounded-md overflow-hidden border block"
                    >
                      <img
                        src={photoUrl(photo.id)}
                        alt={photo.filename ?? ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      {lightboxPhoto && (
        <PhotoLightbox
          src={photoUrl(lightboxPhoto.id)}
          alt={lightboxPhoto.filename}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </PageShell>
  );
};

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-4 py-10">{children}</div>
  </div>
);

PublicGalleryPage.path = "/g/:token";
