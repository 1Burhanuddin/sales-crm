import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../../layout/FormToolbar";
import { EmployeeInputs } from "./EmployeeInputs";

export const EmployeeEdit = () => (
  <EditBase actions={false} redirect="show">
    <div className="mt-2 flex gap-8">
      <Form className="flex flex-1 flex-col gap-4 pb-2">
        <Card>
          <CardContent>
            <EmployeeInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
