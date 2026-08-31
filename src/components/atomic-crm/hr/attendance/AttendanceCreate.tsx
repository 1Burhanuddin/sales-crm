import { CreateBase, Form, useGetIdentity, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";

import { useMyEmployee } from "../useMyEmployee";
import { AttendanceInputs } from "./AttendanceInputs";

const today = () => new Date().toISOString().slice(0, 10);

export const AttendanceCreate = () => {
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const { employee, isPending } = useMyEmployee();
  const isAdmin = Boolean((identity as any)?.administrator);

  if (!isAdmin && isPending) return null;

  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form
            defaultValues={{
              employee_id: isAdmin ? undefined : employee?.id,
              date: today(),
              status: "present",
            }}
          >
            <Card>
              <CardContent>
                <AttendanceInputs />
                <div
                  role="toolbar"
                  className="sticky flex pt-4 pb-4 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-card to-10% flex-row justify-end gap-2"
                >
                  <CancelButton />
                  <SaveButton
                    label={translate(
                      "resources.attendance_records.action.create",
                      { _: "Log Attendance" },
                    )}
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
