import { DataTable } from "@/components/admin/data-table";
import { ReferenceField } from "@/components/admin/reference-field";
import { UrlField } from "@/components/admin/url-field";

export const CompanyTable = () => {
  return (
    <DataTable rowClick="show">
      <DataTable.Col
        source="name"
        cellClassName="max-w-[240px] truncate"
      />
      <DataTable.Col source="city" label="resources.companies.fields.city" />
      <DataTable.Col
        source="phone_number"
        label="resources.companies.fields.phone_number"
      />
      <DataTable.Col label="resources.companies.fields.website">
        <UrlField source="website" />
      </DataTable.Col>
      <DataTable.Col label="Sales Person">
        <ReferenceField source="sales_id" reference="sales" link={false} />
      </DataTable.Col>
    </DataTable>
  );
};
