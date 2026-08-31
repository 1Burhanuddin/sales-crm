import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../../layout/FormToolbar";
import { AttendanceInputs } from "./AttendanceInputs";

export const AttendanceEdit = () => (
  <EditBase actions={false} redirect="list">
    <div className="mt-2 flex gap-8">
      <Form className="flex flex-1 flex-col gap-4 pb-2">
        <Card>
          <CardContent>
            <AttendanceInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
