import {
  CanAccess,
  ShowBase,
  useNotify,
  useRecordContext,
  useShowContext,
  useTranslate,
  useUpdate,
} from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useConfigurationContext } from "../../root/ConfigurationContext";
import type { Payslip } from "../../types";

export const PayslipShow = () => (
  <ShowBase>
    <PayslipShowContent />
  </ShowBase>
);

const PayslipShowContent = () => {
  const translate = useTranslate();
  const { currency } = useConfigurationContext();
  const { isPending } = useShowContext<Payslip>();
  const record = useRecordContext<Payslip>();
  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-2">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">
                <ReferenceField
                  source="employee_id"
                  reference="employees"
                  link={false}
                />
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {record.month}/{record.year}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant={record.status === "finalized" ? "default" : "outline"}>
                {record.status}
              </Badge>
              {record.status === "draft" && (
                <CanAccess resource="payslips" action="edit">
                  <FinalizeButton record={record} />
                </CanAccess>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Field
              label={translate("resources.payslips.fields.basic")}
              value={record.basic}
              currency={currency}
            />
            <Field
              label={translate("resources.payslips.fields.gross_pay")}
              value={record.gross_pay}
              currency={currency}
            />
            <Field
              label={translate("resources.payslips.fields.net_pay")}
              value={record.net_pay}
              currency={currency}
              emphasize
            />
          </div>

          {record.allowances?.length > 0 && (
            <LineItems
              title={translate("resources.payslips.fields.allowances")}
              items={record.allowances}
              currency={currency}
            />
          )}
          {record.deductions?.length > 0 && (
            <LineItems
              title={translate("resources.payslips.fields.deductions")}
              items={record.deductions}
              currency={currency}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({
  label,
  value,
  currency,
  emphasize,
}: {
  label: string;
  value: number;
  currency: string;
  emphasize?: boolean;
}) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={emphasize ? "text-lg font-semibold" : "text-sm"}>
      {value.toLocaleString(undefined, { style: "currency", currency })}
    </p>
  </div>
);

const LineItems = ({
  title,
  items,
  currency,
}: {
  title: string;
  items: { label: string; amount: number }[];
  currency: string;
}) => (
  <div className="mt-4">
    <p className="text-xs text-muted-foreground mb-1">{title}</p>
    <ul className="text-sm space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex justify-between max-w-xs">
          <span>{item.label}</span>
          <span>
            {item.amount.toLocaleString(undefined, {
              style: "currency",
              currency,
            })}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const FinalizeButton = ({ record }: { record: Payslip }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [update, { isPending }] = useUpdate();

  const handleClick = () => {
    update(
      "payslips",
      {
        id: record.id,
        data: { status: "finalized", finalized_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => notify("resources.payslips.finalized", {}),
        onError: () =>
          notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  return (
    <Button size="sm" onClick={handleClick} disabled={isPending}>
      {translate("resources.payslips.action.finalize", { _: "Finalize" })}
    </Button>
  );
};
