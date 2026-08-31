import { CreateBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";

import { PayslipInputs } from "./PayslipInputs";

const currentMonth = () => new Date().getMonth() + 1;
const currentYear = () => new Date().getFullYear();

export const PayslipCreate = () => {
  const translate = useTranslate();
  return (
    <CreateBase redirect="show">
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form
            defaultValues={{
              month: currentMonth(),
              year: currentYear(),
              basic: 0,
              allowances: [],
              deductions: [],
            }}
          >
            <Card>
              <CardContent>
                <PayslipInputs />
                <div
                  role="toolbar"
                  className="sticky flex pt-4 pb-4 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-card to-10% flex-row justify-end gap-2"
                >
                  <CancelButton />
                  <SaveButton
                    label={translate("resources.payslips.action.create", {
                      _: "Create Payslip",
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
