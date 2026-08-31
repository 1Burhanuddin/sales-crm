import { Filter } from "lucide-react";
import { useState } from "react";
import {
  useDataProvider,
  useGetIdentity,
  useGetMany,
  useListContext,
  useNotify,
  useRefresh,
  useTranslate,
} from "ra-core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Company, Contact } from "../types";

/** Bulk-moves selected Contacts or Companies into Leads: copies the
 * relevant fields into a new lead row (status "new"), then deletes the
 * original record. For cleaning up unqualified data that's already sitting
 * in the main CRM tables mixed in with real records. Admin-only (deleting
 * contacts/companies is admin-only in RLS already; the button itself is
 * gated the same way so it doesn't show up and silently fail for others). */
export const BulkMoveToLeadsButton = ({
  resource,
}: {
  resource: "contacts" | "companies";
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const { onUnselectItems, selectedIds = [] } = useListContext();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: selectedRecords = [] } = useGetMany<Contact | Company>(
    resource,
    { ids: selectedIds },
    { enabled: open && selectedIds.length > 0 },
  );

  if (!selectedIds.length || !identity?.administrator) {
    return null;
  }

  const handleConfirm = async () => {
    setBusy(true);
    try {
      for (const record of selectedRecords) {
        const leadData =
          resource === "contacts"
            ? await contactToLead(record as Contact, dataProvider)
            : companyToLead(record as Company);

        await dataProvider.create("leads", {
          data: { ...leadData, sales_id: identity?.id, status: "new" },
        });
        await dataProvider.delete(resource, {
          id: record.id,
          previousData: record,
        });
      }

      notify("resources.leads.moved_to_leads", {
        messageArgs: { smart_count: selectedRecords.length },
      });
      setOpen(false);
      onUnselectItems();
      refresh();
    } catch (error) {
      notify("ra.notification.http_error", { type: "error" });
      console.error("Bulk move to leads failed:", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => setOpen(true)}
      >
        <Filter />
        {translate("resources.leads.action.move_to_leads", {
          _: "Move to Leads",
        })}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate("resources.leads.action.move_to_leads", {
                _: "Move to Leads",
              })}
            </DialogTitle>
            <DialogDescription>
              {translate("resources.leads.move_to_leads_confirm", {
                smart_count: selectedIds.length,
                _: `This deletes ${selectedIds.length} ${resource} record(s) and recreates them as unqualified leads. This can't be undone.`,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {translate("ra.action.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
              {translate("resources.leads.action.move_to_leads", {
                _: "Move to Leads",
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const contactToLead = async (
  contact: Contact,
  dataProvider: ReturnType<typeof useDataProvider>,
) => {
  let companyName: string | undefined;
  if (contact.company_id) {
    try {
      const { data: company } = await dataProvider.getOne<Company>(
        "companies",
        { id: contact.company_id },
      );
      companyName = company.name;
    } catch {
      // company may already be gone; leave company_name blank
    }
  }
  return {
    first_name: contact.first_name,
    last_name: contact.last_name,
    title: contact.title,
    company_name: companyName,
    email: contact.email_jsonb?.[0]?.email,
    phone: contact.phone_jsonb?.[0]?.number,
    source: "moved-from-contacts",
  };
};

const companyToLead = (company: Company) => ({
  company_name: company.name,
  phone: company.phone_number,
  source: "moved-from-companies",
});
