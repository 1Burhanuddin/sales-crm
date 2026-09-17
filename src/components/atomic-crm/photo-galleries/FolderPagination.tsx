import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslate } from "ra-core";
import { Button } from "@/components/ui/button";

export const FolderPagination = ({
  page,
  perPage,
  total,
  onPageChange,
}: {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}) => {
  const translate = useTranslate();
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4 mr-1" />
        {translate("ra.navigation.prev", { _: "Prev" })}
      </Button>
      <span className="text-xs text-muted-foreground">
        {translate("crm.photo_galleries.page_of", {
          _: `Page ${page} of ${pageCount}`,
          page,
          total: pageCount,
        })}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {translate("ra.navigation.next", { _: "Next" })}
        <ChevronRight className="size-4 ml-1" />
      </Button>
    </div>
  );
};
