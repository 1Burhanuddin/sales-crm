import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";

export const PersonalNoteTable = () => (
  <DataTable rowClick="edit">
    <DataTable.Col source="title" />
    <DataTable.Col source="content" cellClassName="max-w-[360px] truncate" />
    <DataTable.Col label="resources.personal_notes.fields.updated_at">
      <DateField source="updated_at" />
    </DataTable.Col>
  </DataTable>
);
