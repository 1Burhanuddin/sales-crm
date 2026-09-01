import { EmployeeList } from "./EmployeeList";
import { EmployeeCreate } from "./EmployeeCreate";
import { EmployeeEdit } from "./EmployeeEdit";
import { EmployeeShow } from "./EmployeeShow";
import { employeeRecordRepresentation } from "./employeeRecordRepresentation";

export default {
  list: EmployeeList,
  create: EmployeeCreate,
  edit: EmployeeEdit,
  show: EmployeeShow,
  recordRepresentation: employeeRecordRepresentation,
};
