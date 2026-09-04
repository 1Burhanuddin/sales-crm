import { CreateBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";

import { RecurringExpenseInputs } from "./RecurringExpenseInputs";

export const RecurringExpenseCreate = () => {
  const translate = useTranslate();
  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form defaultValues={{ scope: "personal", active: true, due_day: 1 }}>
            <Card>
              <CardContent>
                <RecurringExpenseInputs />
                <div
                  role="toolbar"
                  className="sticky flex pt-4 pb-4 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-card to-10% flex-row justify-end gap-2"
                >
                  <CancelButton />
                  <SaveButton
                    label={translate("resources.recurring_expenses.action.create", {
                      _: "Add Recurring Expense",
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};
