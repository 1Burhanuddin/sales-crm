import { useRecordContext, useTranslate } from "ra-core";
import { useState } from "react";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TopToolbar } from "../layout/TopToolbar";
import type { Lead } from "../types";
import { LeadStatusField } from "./LeadStatusField";

const TABS = [
  { key: "funnel", label: "In Funnel", filter: { "status@neq": "disqualified" } },
  { key: "new", label: "New", filter: { status: "new" } },
  { key: "contacted", label: "Contacted", filter: { status: "contacted" } },
  { key: "qualified", label: "Qualified", filter: { status: "qualified" } },
  { key: "disqualified", label: "Disqualified", filter: { status: "disqualified" } },
  { key: "all", label: "All", filter: {} },
] as const;

const filters = [<SearchInput source="q" alwaysOn />];

export const LeadList = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("funnel");
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <List
      title={false}
      perPage={25}
      filters={filters}
      filter={activeTab.filter}
      sort={{ field: "created_at", order: "DESC" }}
      actions={<LeadListActions />}
    >
      <div className="flex gap-1 mb-3">
        {TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "text-muted-foreground",
              tab === t.key && "bg-accent text-accent-foreground",
            )}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <DataTable rowClick="show">
        <DataTable.Col source="company_name" />
        <DataTable.Col label="resources.leads.fields.status">
          <LeadStatusField />
        </DataTable.Col>
        <DataTable.Col source="phone" label="resources.leads.fields.phone" />
        <DataTable.Col label="resources.leads.fields.assignee_id">
          <ReferenceField source="assignee_id" reference="sales" link={false} />
        </DataTable.Col>
        <DataTable.Col label="resources.leads.fields.name">
          <LeadNameField />
        </DataTable.Col>
        <DataTable.Col source="email" />
      </DataTable>
    </List>
  );
};

// DataTable.Col can't take a render-prop function as children directly --
// it needs a real field component reading the record via context, same as
// LeadStatusField.
const LeadNameField = () => {
  const record = useRecordContext<Lead>();
  if (!record) return null;
  const name = `${record.first_name ?? ""} ${record.last_name ?? ""}`.trim();
  return <span>{name || "—"}</span>;
};

const LeadListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.leads.action.create", { _: "Add Lead" })}
      />
    </TopToolbar>
  );
};
