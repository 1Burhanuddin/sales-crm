import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../layout/FormToolbar";
import { RecurringExpenseInputs } from "./RecurringExpenseInputs";

export const RecurringExpenseEdit = () => (
  <EditBase actions={false} redirect="list">
    <div className="mt-2 flex gap-8">
      <Form className="flex flex-1 flex-col gap-4 pb-2">
        <Card>
          <CardContent>
            <RecurringExpenseInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
