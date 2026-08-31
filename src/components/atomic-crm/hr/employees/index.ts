import type { Employee } from "../../types";
import { EmployeeList } from "./EmployeeList";
import { EmployeeCreate } from "./EmployeeCreate";
import { EmployeeEdit } from "./EmployeeEdit";
import { EmployeeShow } from "./EmployeeShow";

export default {
  list: EmployeeList,
  create: EmployeeCreate,
  edit: EmployeeEdit,
  show: EmployeeShow,
  recordRepresentation: (record: Employee) =>
    `${record.first_name} ${record.last_name}`,
};
