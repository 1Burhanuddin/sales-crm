import {
  CreateBase,
  EditBase,
  Form,
  required,
  useGetList,
  useTranslate,
  type Identifier,
} from "ra-core";
import { DateInput } from "@/components/admin/date-input";
import { SaveButton } from "@/components/admin/form";
import { NumberInput } from "@/components/admin/number-input";
import { FormToolbar as SimpleFormToolbar } from "@/components/admin/simple-form";
import { Card, CardContent } from "@/components/ui/card";

import type { SalaryStructure } from "../../types";
import { SalaryLineItemsInput } from "./SalaryLineItemsInput";

/** Admin-only, one salary structure per employee (upsert-style: renders a
 * Create form until one exists, then an Edit form for that row). */
export const SalaryStructureCard = ({
  employeeId,
}: {
  employeeId: Identifier;
}) => {
  const translate = useTranslate();
  const { data, isPending, refetch } = useGetList<SalaryStructure>(
    "salary_structures",
    {
      pagination: { page: 1, perPage: 1 },
      filter: { employee_id: employeeId },
    },
  );

  if (isPending) return null;
  const existing = data?.[0];

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">
          {translate("resources.salary_structures.name", {
            smart_count: 1,
            _: "Salary",
          })}
        </h3>
        {existing ? (
          <EditBase
            resource="salary_structures"
            id={existing.id}
            redirect={false}
            mutationMode="pessimistic"
          >
            <Form className="flex flex-col gap-4">
              <SalaryStructureFields />
              <SimpleFormToolbar>
                <SaveButton />
              </SimpleFormToolbar>
            </Form>
          </EditBase>
        ) : (
          <CreateBase
            resource="salary_structures"
            redirect={false}
            mutationOptions={{ onSuccess: () => refetch() }}
          >
            <Form
              className="flex flex-col gap-4"
              defaultValues={{
                employee_id: employeeId,
                basic: 0,
                allowances: [],
                deductions: [],
              }}
            >
              <SalaryStructureFields />
              <SimpleFormToolbar>
                <SaveButton />
              </SimpleFormToolbar>
            </Form>
          </CreateBase>
        )}
      </CardContent>
    </Card>
  );
};

const SalaryStructureFields = () => (
  <>
    <div className="flex gap-4">
      <NumberInput source="basic" validate={required()} helperText={false} />
      <DateInput source="effective_from" helperText={false} />
    </div>
    <SalaryLineItemsInput source="allowances" label="Allowances" />
    <SalaryLineItemsInput source="deductions" label="Deductions" />
  </>
);
