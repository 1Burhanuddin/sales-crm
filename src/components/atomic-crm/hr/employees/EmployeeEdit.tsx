import { EditBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../../layout/FormToolbar";
import { EmployeeInputs } from "./EmployeeInputs";

export const EmployeeEdit = () => {
  const { identity } = useGetIdentity();
  const isAdmin = Boolean((identity as { administrator?: boolean } | undefined)?.administrator);

  return (
    <EditBase actions={false} redirect="show">
      <div className="mt-2 flex gap-8">
        <Form className="flex flex-1 flex-col gap-4 pb-2">
          <Card>
            <CardContent>
              <EmployeeInputs isAdmin={isAdmin} showEmployeeCode />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </EditBase>
  );
};
