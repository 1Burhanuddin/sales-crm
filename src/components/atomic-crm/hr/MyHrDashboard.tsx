import { useGetList, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { AttendanceRecord, LeaveRequest, Payslip } from "../types";
import { useMyEmployee } from "./useMyEmployee";

export const MyHrDashboard = () => {
  const translate = useTranslate();
  const { employee, isPending } = useMyEmployee();

  if (isPending) return null;

  if (!employee) {
    return (
      <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
        {translate("crm.hr.no_employee_record", {
          _: "Ask your HR admin to link your account to an employee record.",
        })}
      </div>
    );
  }

  return (
    <div className="mt-2 max-w-3xl mx-auto flex flex-col gap-4 pb-8">
      <ProfileCard employee={employee} />
      <LeaveBalanceCard employeeId={employee.id} />
      <RecentAttendanceCard employeeId={employee.id} />
      <RecentPayslipsCard employeeId={employee.id} />
    </div>
  );
};

const ProfileCard = ({
  employee,
}: {
  employee: NonNullable<ReturnType<typeof useMyEmployee>["employee"]>;
}) => (
  <Card>
    <CardContent>
      <h2 className="text-2xl font-semibold">
        {employee.first_name} {employee.last_name}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        {[employee.designation, employee.department].filter(Boolean).join(" · ")}
      </p>
    </CardContent>
  </Card>
);

const LeaveBalanceCard = ({ employeeId }: { employeeId: number | string }) => {
  const translate = useTranslate();
  const { leaveTypes } = useConfigurationContext();
  const currentYear = new Date().getFullYear();
  const { data: approvedRequests, isPending } = useGetList<LeaveRequest>(
    "leave_requests",
    {
      pagination: { page: 1, perPage: 1000 },
      filter: { employee_id: employeeId, status: "approved" },
    },
  );

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {translate("crm.hr.leave_balance", { _: "Leave Balance" })}
          </h3>
          <Button asChild size="sm">
            <Link to="/leave_requests/create">
              {translate("resources.leave_requests.action.new", {
                _: "New Leave Request",
              })}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {leaveTypes.map((type) => {
            const used =
              approvedRequests
                ?.filter((r) => r.leave_type === type.value)
                .filter(
                  (r) => new Date(r.from_date).getFullYear() === currentYear,
                )
                .reduce((sum, r) => sum + (r.days ?? 0), 0) ?? 0;
            const remaining = type.annual_days - used;
            return (
              <div key={type.value}>
                <p className="text-xs text-muted-foreground">{type.label}</p>
                <p className="text-lg font-semibold">
                  {isPending ? "…" : `${remaining} / ${type.annual_days}`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const RecentAttendanceCard = ({
  employeeId,
}: {
  employeeId: number | string;
}) => {
  const translate = useTranslate();
  const { data } = useGetList<AttendanceRecord>("attendance_records", {
    pagination: { page: 1, perPage: 5 },
    sort: { field: "date", order: "DESC" },
    filter: { employee_id: employeeId },
  });

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">
          {translate("resources.attendance_records.name", {
            smart_count: 2,
          })}
        </h3>
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">
            {translate("resources.attendance_records.empty.title", {
              _: "No attendance records found",
            })}
          </p>
        ) : (
          <ul className="text-sm space-y-1">
            {data.map((record) => (
              <li key={record.id} className="flex justify-between">
                <span>{record.date}</span>
                <Badge variant="outline">{record.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const RecentPayslipsCard = ({ employeeId }: { employeeId: number | string }) => {
  const translate = useTranslate();
  const { currency } = useConfigurationContext();
  const { data } = useGetList<Payslip>("payslips", {
    pagination: { page: 1, perPage: 3 },
    sort: { field: "year", order: "DESC" },
    filter: { employee_id: employeeId },
  });

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">
          {translate("resources.payslips.name", { smart_count: 2 })}
        </h3>
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">
            {translate("resources.payslips.empty.title", {
              _: "No payslips found",
            })}
          </p>
        ) : (
          <ul className="text-sm space-y-1">
            {data.map((payslip) => (
              <li key={payslip.id} className="flex justify-between items-center">
                <Link
                  to={`/payslips/${payslip.id}/show`}
                  className="hover:underline"
                >
                  {payslip.month}/{payslip.year}
                </Link>
                <span className="flex items-center gap-2">
                  {payslip.net_pay.toLocaleString(undefined, {
                    style: "currency",
                    currency,
                  })}
                  <Badge
                    variant={
                      payslip.status === "finalized" ? "default" : "outline"
                    }
                  >
                    {payslip.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

MyHrDashboard.path = "/my-hr";
