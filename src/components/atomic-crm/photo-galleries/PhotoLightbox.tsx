import { X } from "lucide-react";
import { useEffect } from "react";

// Deliberately a plain fixed overlay, not the shadcn Dialog -- that
// component's default max-width/padding are sized for form content,
// not for showing an image as large as the viewport allows.
export const PhotoLightbox = ({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt?: string | null;
  onClose: () => void;
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        <X className="size-6" />
      </button>
      <img
        src={src}
        alt={alt ?? ""}
        className="max-h-[80vh] max-w-[80vw] rounded-md object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
