import {
  CanAccess,
  ShowBase,
  useRecordContext,
  useShowContext,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Employee } from "../../types";
import { SalaryStructureCard } from "../payroll/SalaryStructureCard";

export const EmployeeShow = () => (
  <ShowBase>
    <EmployeeShowContent />
  </ShowBase>
);

const EmployeeShowContent = () => {
  const translate = useTranslate();
  const { isPending } = useShowContext<Employee>();
  const record = useRecordContext<Employee>();
  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-2">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">
                {record.first_name} {record.last_name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {[record.designation, record.department]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link to={`/employees/${record.id}`}>
                  <Pencil className="w-4 h-4" />
                  {translate("ra.action.edit")}
                </Link>
              </Button>
              <DeleteButton redirect="list" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Field
              label={translate("resources.employees.fields.email")}
              value={record.email}
            />
            <Field
              label={translate("resources.employees.fields.phone")}
              value={record.phone}
            />
            <Field
              label={translate("resources.employees.fields.employee_code")}
              value={record.employee_code}
            />
            <Field
              label={translate("resources.employees.fields.employment_type")}
              value={record.employment_type}
            />
            <Field
              label={translate("resources.employees.fields.status")}
              value={record.status}
            />
            <Field
              label={translate("resources.employees.fields.date_of_joining")}
              value={record.date_of_joining}
            />
            {record.date_of_leaving && (
              <Field
                label={translate(
                  "resources.employees.fields.date_of_leaving",
                )}
                value={record.date_of_leaving}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <CanAccess resource="salary_structures" action="create">
        <SalaryStructureCard employeeId={record.id} />
      </CanAccess>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
};
