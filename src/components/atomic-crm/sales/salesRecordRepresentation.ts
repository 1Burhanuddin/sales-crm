import type { Sale } from "../types";

// Split out of index.ts (#86), same reasoning as
// hr/employees/employeeRecordRepresentation.ts -- lets CRM.tsx import
// this eagerly while List/Create/Edit still lazy-load, since any
// ReferenceField pointing at "sales" needs a label immediately.
export const salesRecordRepresentation = (record: Sale) =>
  `${record.first_name} ${record.last_name}`;
