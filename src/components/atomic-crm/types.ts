import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";

import type {
  COMPANY_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  DEAL_CREATED,
  DEAL_NOTE_CREATED,
} from "./consts";

export type SignUpData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type SalesFormData = {
  avatar?: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
  is_developer: boolean;
};

export type Sale = {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  is_developer?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  state_abbr: string;
  sales_id?: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_deals?: number;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id?: Identifier | null;
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: number[];
  gender: string;
  sales_id?: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];
  nb_tasks?: number;
  company_name?: string;
} & Pick<RaRecord, "id">;

export type ContactNote = {
  contact_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

export type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
} & Pick<RaRecord, "id">;

export type DealNote = {
  deal_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type Project = {
  name: string;
  description?: string;
  sales_id?: Identifier;
  created_at: string;
  updated_at: string;
  nb_issues?: number;
} & Pick<RaRecord, "id">;

export type Issue = {
  project_id: Identifier;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee_id?: Identifier;
  due_date?: string;
  sales_id?: Identifier;
  created_at: string;
  updated_at: string;
  index: number;
} & Pick<RaRecord, "id">;

export type Employee = {
  sales_id?: Identifier | null;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  employment_type?: string;
  status: string;
  date_of_joining: string;
  date_of_leaving?: string;
  avatar?: RAFile;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type LeaveRequest = {
  employee_id: Identifier;
  leave_type: string;
  from_date: string;
  to_date: string;
  days?: number;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: Identifier | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type AttendanceRecord = {
  employee_id: Identifier;
  date: string;
  status: string;
  check_in?: string | null;
  check_out?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type SalaryLineItem = {
  label: string;
  amount: number;
};

export type SalaryStructure = {
  employee_id: Identifier;
  basic: number;
  allowances: SalaryLineItem[];
  deductions: SalaryLineItem[];
  effective_from: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type Payslip = {
  employee_id: Identifier;
  month: number;
  year: number;
  basic: number;
  allowances: SalaryLineItem[];
  deductions: SalaryLineItem[];
  gross_pay: number;
  net_pay: number;
  status: "draft" | "finalized";
  finalized_at?: string | null;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type ChecklistItem = {
  text: string;
  checked: boolean;
};

export type PersonalNote = {
  sales_id?: Identifier;
  title?: string;
  content?: string;
  type: "note" | "checklist";
  checklist_items: ChecklistItem[];
  tags?: number[];
  color?: string | null;
  pinned: boolean;
  archived_at?: string | null;
  deleted_at?: string | null;
  attachments?: AttachmentNote[];
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type PersonalNoteVersion = {
  note_id: Identifier;
  title?: string;
  content?: string;
  type: "note" | "checklist";
  checklist_items: ChecklistItem[];
  tags?: number[];
  color?: string | null;
  created_at: string;
} & Pick<RaRecord, "id">;

export type PersonalNoteShare = {
  note_id: Identifier;
  shared_with_sales_id: Identifier;
  created_at: string;
} & Pick<RaRecord, "id">;

export type IssueNote = {
  issue_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type Task = {
  contact_id: Identifier;
  type: string;
  text: string;
  due_date: string;
  done_date?: string | null;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;

export type ActivityCompanyCreated = {
  type: typeof COMPANY_CREATED;
  company_id: Identifier;
  company: Company;
  sales_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  sales_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityDealCreated = {
  type: typeof DEAL_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  deal: Deal;
  date: string;
};

export type ActivityDealNoteCreated = {
  type: typeof DEAL_NOTE_CREATED;
  sales_id?: Identifier;
  dealNote: DealNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityCompanyCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityDealCreated
    | ActivityDealNoteCreated
  );

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;

export interface LabeledValue {
  value: string;
  label: string;
}

export type DealStage = LabeledValue;

export interface NoteStatus extends LabeledValue {
  color: string;
}

export interface LeaveType extends LabeledValue {
  annual_days: number;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}
