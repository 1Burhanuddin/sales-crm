import type { Employee } from "../../types";

// Split out of index.ts (#86) so CRM.tsx can import this one tiny
// function eagerly while still lazy-loading EmployeeList/Create/Edit/Show
// via lazyResource -- recordRepresentation is used well outside the
// employees module itself (any ReferenceField pointing at "employees"
// needs it immediately to render a label), so it can't be part of the
// same lazy chunk as the heavy view components without forcing that
// whole chunk to load just to show a name somewhere else in the app.
export const employeeRecordRepresentation = (record: Employee) =>
  `${record.first_name} ${record.last_name}`;
