import { Share2, X } from "lucide-react";
import {
  useCreate,
  useDelete,
  useGetIdentity,
  useGetList,
  useGetMany,
  useNotify,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { PersonalNote, PersonalNoteShare, Sale } from "../types";

export const ShareDialog = () => {
  const translate = useTranslate();
  const record = useRecordContext<PersonalNote>();
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [deleteOne] = useDelete();

  const { data: shares, refetch: refetchShares } = useGetList<PersonalNoteShare>(
    "personal_note_shares",
    {
      pagination: { page: 1, perPage: 50 },
      filter: { note_id: record?.id },
    },
    { enabled: !!record },
  );
  const { data: allSales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "first_name", order: "ASC" },
  });
  const { data: sharedSales } = useGetMany<Sale>(
    "sales",
    { ids: shares?.map((s) => s.shared_with_sales_id) },
    { enabled: !!shares && shares.length > 0 },
  );

  if (!record) return null;

  const sharedIds = new Set(shares?.map((s) => s.shared_with_sales_id));
  const available = allSales?.filter(
    (s) => s.id !== identity?.id && !sharedIds.has(s.id),
  );

  const addShare = (salesId: number) => {
    create(
      "personal_note_shares",
      { data: { note_id: record.id, shared_with_sales_id: salesId } },
      {
        onSuccess: () => refetchShares(),
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  const removeShare = (shareId: number) => {
    deleteOne(
      "personal_note_shares",
      { id: shareId },
      {
        onSuccess: () => refetchShares(),
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={translate("resources.personal_notes.action.share", {
            _: "Share",
          })}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <h4 className="text-sm font-medium mb-2">
          {translate("resources.personal_notes.action.share", { _: "Share" })}
        </h4>

        {shares && shares.length > 0 && (
          <div className="flex flex-col gap-1 mb-3">
            {shares.map((share) => {
              const sale = sharedSales?.find(
                (s) => s.id === share.shared_with_sales_id,
              );
              return (
                <div
                  key={share.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {sale ? `${sale.first_name} ${sale.last_name}` : "…"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeShare(share.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-full">
              {translate("resources.personal_notes.action.add_person", {
                _: "Add person",
              })}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {available?.length ? (
              available.map((sale) => (
                <DropdownMenuItem key={sale.id} onClick={() => addShare(sale.id)}>
                  {sale.first_name} {sale.last_name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                {translate("resources.personal_notes.no_one_to_share", {
                  _: "No one else to share with",
                })}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </PopoverContent>
    </Popover>
  );
};
