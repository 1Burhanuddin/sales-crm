import { SalesCreate } from "./SalesCreate";
import { SalesEdit } from "./SalesEdit";
import { SalesList } from "./SalesList";
import { salesRecordRepresentation } from "./salesRecordRepresentation";

export default {
  list: SalesList,
  create: SalesCreate,
  edit: SalesEdit,
  recordRepresentation: salesRecordRepresentation,
};
