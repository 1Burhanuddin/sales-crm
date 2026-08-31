import { Edit, Plus } from "lucide-react";
import { useGetMany, useRecordContext, useTranslate, useUpdate } from "ra-core";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TagChip } from "../tags/TagChip";
import { TagCreateModal } from "../tags/TagCreateModal";
import { useTags } from "../tags/useTags";
import type { PersonalNote, Tag } from "../types";

// Near-duplicate of contacts/TagsListEdit.tsx, hardcoded to personal_notes —
// same "separate component set" precedent as IssueNoteInputs vs NoteInputs,
// rather than generalizing a component that's tightly coupled to "contacts".
export const PersonalNoteTagsEdit = () => {
  const record = useRecordContext<PersonalNote>();
  const [open, setOpen] = useState(false);
  const translate = useTranslate();

  const { data: allTags, isPending: isPendingAllTags } = useTags({
    perPage: 10,
  });
  const { data: tags, isPending: isPendingRecordTags } = useGetMany<Tag>(
    "tags",
    { ids: record?.tags },
    { enabled: !!record?.tags && record.tags.length > 0 },
  );
  const [update] = useUpdate<PersonalNote>();

  const unselectedTags =
    allTags && record && allTags.filter((tag) => !record.tags?.includes(tag.id));

  const handleTagAdd = (id: number) => {
    if (!record) return;
    update("personal_notes", {
      id: record.id,
      data: { tags: [...(record.tags ?? []), id] },
      previousData: record,
    });
  };

  const handleTagDelete = async (id: number) => {
    if (!record) return;
    await update("personal_notes", {
      id: record.id,
      data: { tags: (record.tags ?? []).filter((tagId) => tagId !== id) },
      previousData: record,
    });
  };

  const handleTagCreated = useCallback(
    async (tag: Tag) => {
      if (!record) return;
      await update(
        "personal_notes",
        {
          id: record.id,
          data: { tags: [...(record.tags ?? []), tag.id] },
          previousData: record,
        },
        { onSuccess: () => setOpen(false) },
      );
    },
    [update, record],
  );

  if (!record || isPendingRecordTags || isPendingAllTags) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map((tag) => (
        <div key={tag.id}>
          <TagChip tag={tag} onUnlink={() => handleTagDelete(tag.id)} />
        </div>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 md:h-6 cursor-pointer">
            <Plus className="w-4 h-4 md:w-3 md:h-3 mr-1" />
            {translate("resources.tags.action.add")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {unselectedTags?.map((tag) => (
            <DropdownMenuItem key={tag.id} onClick={() => handleTagAdd(tag.id)}>
              <Badge
                variant="secondary"
                className="text-sm md:text-xs font-normal text-black"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </Badge>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start p-0 cursor-pointer text-base md:text-sm"
            >
              <Edit className="w-4 h-4 md:w-3 md:h-3 mr-2" />
              {translate("resources.tags.action.create")}
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TagCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleTagCreated}
      />
    </div>
  );
};
