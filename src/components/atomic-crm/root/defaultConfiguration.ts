import type { ConfigurationContextValue } from "./ConfigurationContext";
import type { TransactionCategory } from "../types";
// Import the logos as module assets so Vite resolves their URL relative to the
// JS chunk (import.meta.url), not the current route. A plain "./logos/..." path
// breaks on nested routes like /oauth/consent and under a deployment sub-path.
import darkModeLogo from "./logos/logo_atomic_crm_dark.svg";
import lightModeLogo from "./logos/logo_atomic_crm_light.svg";

export const defaultDarkModeLogo = darkModeLogo;
export const defaultLightModeLogo = lightModeLogo;

export const defaultCurrency = "USD";

export const defaultTitle = "Quixsyn CRM";

export const defaultCompanySectors = [
  { value: "communication-services", label: "Communication Services" },
  { value: "consumer-discretionary", label: "Consumer Discretionary" },
  { value: "consumer-staples", label: "Consumer Staples" },
  { value: "energy", label: "Energy" },
  { value: "financials", label: "Financials" },
  { value: "health-care", label: "Health Care" },
  { value: "industrials", label: "Industrials" },
  { value: "information-technology", label: "Information Technology" },
  { value: "materials", label: "Materials" },
  { value: "real-estate", label: "Real Estate" },
  { value: "utilities", label: "Utilities" },
];

export const defaultDealStages = [
  { value: "opportunity", label: "Opportunity" },
  { value: "proposal-sent", label: "Proposal Sent" },
  { value: "in-negociation", label: "In Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "delayed", label: "Delayed" },
];

export const defaultDealPipelineStatuses = ["won"];

export const defaultDealCategories = [
  { value: "other", label: "Other" },
  { value: "copywriting", label: "Copywriting" },
  { value: "print-project", label: "Print project" },
  { value: "ui-design", label: "UI Design" },
  { value: "website-design", label: "Website design" },
];

export const defaultNoteStatuses = [
  { value: "cold", label: "Cold", color: "#7dbde8" },
  { value: "warm", label: "Warm", color: "#e8cb7d" },
  { value: "hot", label: "Hot", color: "#e88b7d" },
  { value: "in-contract", label: "In Contract", color: "#a4e87d" },
];

export const defaultIssueStatuses = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review", label: "In Review" },
  { value: "done", label: "Done" },
];

export const defaultIssuePriorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const defaultTaskTypes = [
  { value: "none", label: "None" },
  { value: "email", label: "Email" },
  { value: "demo", label: "Demo" },
  { value: "lunch", label: "Lunch" },
  { value: "meeting", label: "Meeting" },
  { value: "follow-up", label: "Follow-up" },
  { value: "thank-you", label: "Thank you" },
  { value: "ship", label: "Ship" },
  { value: "call", label: "Call" },
];

export const defaultDepartments = [
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "HR" },
];

export const defaultDesignations = [
  { value: "software-engineer", label: "Software Engineer" },
  { value: "sales-executive", label: "Sales Executive" },
  { value: "manager", label: "Manager" },
  { value: "intern", label: "Intern" },
];

export const defaultEmploymentTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

export const defaultEmployeeStatuses = [
  { value: "active", label: "Active" },
  { value: "on-leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

export const defaultLeaveTypes = [
  { value: "annual", label: "Annual Leave", annual_days: 18 },
  { value: "sick", label: "Sick Leave", annual_days: 10 },
  { value: "unpaid", label: "Unpaid Leave", annual_days: 0 },
];

export const defaultAttendanceStatuses = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "half-day", label: "Half Day" },
  { value: "on-leave", label: "On Leave" },
  { value: "holiday", label: "Holiday" },
];

export const defaultTransactionCategories: TransactionCategory[] = [
  { value: "salary", label: "Salary", type: "income" },
  { value: "business-income", label: "Business Income", type: "income" },
  { value: "other-income", label: "Other Income", type: "income" },
  { value: "food", label: "Food", type: "expense" },
  { value: "groceries", label: "Groceries", type: "expense" },
  { value: "rent", label: "Rent", type: "expense" },
  { value: "utilities", label: "Utilities", type: "expense" },
  { value: "transport", label: "Transport", type: "expense" },
  { value: "shopping", label: "Shopping", type: "expense" },
  { value: "entertainment", label: "Entertainment", type: "expense" },
  { value: "healthcare", label: "Healthcare", type: "expense" },
  { value: "education", label: "Education", type: "expense" },
  { value: "subscriptions", label: "Subscriptions & Software", type: "expense" },
  { value: "advertising", label: "Advertising", type: "expense" },
  { value: "government-fees", label: "Government & Fees", type: "expense" },
  { value: "fees-charges", label: "Bank & Card Charges", type: "expense" },
  { value: "transfer", label: "Transfer", type: "expense" },
  { value: "other", label: "Other", type: "expense" },
];

// Calibrated against a real Bank of Baroda statement's UPI/NEFT description
// patterns (see accounts/statementParser.ts). Substring match, first rule
// wins — kept roughly most-specific-first so a generic handle fragment
// can't shadow a more specific merchant keyword above it.
export const defaultCategoryRules = [
  { keyword: "DARSHAN UNIVERSITY", category: "salary" },
  { keyword: "AEPS/MT", category: "other-income" },
  { keyword: "BY CASH", category: "other-income" },
  { keyword: "INT.PD", category: "other-income" },
  { keyword: "SWIGGY", category: "food" },
  { keyword: "ZOMATO", category: "food" },
  { keyword: "ICE CR", category: "food" },
  { keyword: "DMART", category: "groceries" },
  { keyword: "PINEDMART", category: "groceries" },
  { keyword: "MEESHO", category: "shopping" },
  { keyword: "BHARATPE", category: "shopping" },
  { keyword: "GSRTC", category: "transport" },
  { keyword: "ROPPENTRANSPORT", category: "transport" },
  { keyword: "MSAAYUSHHEALTHCARE", category: "healthcare" },
  { keyword: "ELEARNINGQURAN", category: "education" },
  { keyword: "GOOGLECLOUD", category: "subscriptions" },
  { keyword: "PLAYSTORE", category: "subscriptions" },
  { keyword: "LINKEDIN", category: "subscriptions" },
  { keyword: "VYAPAR", category: "subscriptions" },
  { keyword: "FACEBOOKADS", category: "advertising" },
  { keyword: "FACEBOOKINDIA", category: "advertising" },
  { keyword: "PASSPORTSEVA", category: "government-fees" },
  { keyword: "SETUVERIFY", category: "fees-charges" },
  { keyword: "DCARDFEE", category: "fees-charges" },
  { keyword: "SMS CHARGES", category: "fees-charges" },
  { keyword: "SALARY", category: "salary" },
];

export const defaultConfiguration: ConfigurationContextValue = {
  companySectors: defaultCompanySectors,
  currency: defaultCurrency,
  dealCategories: defaultDealCategories,
  dealPipelineStatuses: defaultDealPipelineStatuses,
  dealStages: defaultDealStages,
  issueStatuses: defaultIssueStatuses,
  issuePriorities: defaultIssuePriorities,
  noteStatuses: defaultNoteStatuses,
  taskTypes: defaultTaskTypes,
  departments: defaultDepartments,
  designations: defaultDesignations,
  employmentTypes: defaultEmploymentTypes,
  employeeStatuses: defaultEmployeeStatuses,
  leaveTypes: defaultLeaveTypes,
  attendanceStatuses: defaultAttendanceStatuses,
  transactionCategories: defaultTransactionCategories,
  categoryRules: defaultCategoryRules,
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
};
