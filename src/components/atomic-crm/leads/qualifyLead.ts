import type { DataProvider } from "ra-core";

import type { Company, Deal, Lead } from "../types";

/** Converts a lead into a real Contact (+ Company if given, + a starter
 * Deal), and marks the lead qualified with the resulting record ids kept
 * as an audit trail (converted_*_id) -- the lead row itself is never
 * deleted, only its status changes. */
export const qualifyLead = async (
  lead: Lead,
  dataProvider: DataProvider,
  {
    salesId,
    firstDealStage,
  }: { salesId?: number | string; firstDealStage: string },
) => {
  let companyId = lead.converted_company_id ?? undefined;
  if (!companyId && lead.company_name) {
    const { data: company } = await dataProvider.create<Company>("companies", {
      data: { name: lead.company_name, sales_id: salesId },
    });
    companyId = company.id;
  }

  const { data: contact } = await dataProvider.create("contacts", {
    data: {
      first_name: lead.first_name || "Unknown",
      last_name: lead.last_name || "",
      title: lead.title,
      company_id: companyId,
      email_jsonb: lead.email ? [{ email: lead.email, type: "Work" }] : [],
      phone_jsonb: lead.phone ? [{ number: lead.phone, type: "Work" }] : [],
      sales_id: salesId,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    },
  });

  let dealId: number | string | undefined;
  const dealName = lead.company_name || `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim();
  if (dealName) {
    const { data: deal } = await dataProvider.create<Deal>("deals", {
      data: {
        name: dealName,
        company_id: companyId,
        contact_ids: [contact.id],
        stage: firstDealStage,
        sales_id: salesId,
      },
    });
    dealId = deal.id;
  }

  await dataProvider.update("leads", {
    id: lead.id,
    data: {
      status: "qualified",
      converted_contact_id: contact.id,
      converted_company_id: companyId,
      converted_deal_id: dealId,
    },
    previousData: lead,
  });

  return { contactId: contact.id, companyId, dealId };
};
