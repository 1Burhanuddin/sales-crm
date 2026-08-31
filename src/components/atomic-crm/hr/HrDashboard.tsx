import { format } from "date-fns";
import {
  CalendarCheck,
  ClipboardList,
  Receipt,
  Users,
} from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { AttendanceRecord, Employee, LeaveRequest, Payslip } from "../types";

const SEQUENTIAL_STEPS = [
  "#0d366b",
  "#104281",
  "#184f95",
  "#1c5cab",
  "#256abf",
  "#2a78d6",
  "#5598e7",
  "#6da7ec",
];
const STATUS = { good: "#0ca30c", warning: "#c98500", critical: "#d03b3b" };

const RankedRow = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="w-32 shrink-0 text-sm truncate">{label}</span>
    <div className="flex-1 h-3 rounded-sm bg-muted overflow-hidden">
      <div
        className="h-full rounded-sm"
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }}
      />
    </div>
    <span className="w-8 shrink-0 text-sm text-right tabular-nums text-muted-foreground">
      {value}
    </span>
  </div>
);

const StatTile = ({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueStyle?: React.CSSProperties;
}) => (
  <Card>
    <CardContent className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums" style={valueStyle}>
        {value}
      </div>
    </CardContent>
  </Card>
);

export const HrDashboard = () => {
  const translate = useTranslate();
  const { attendanceStatuses } = useConfigurationContext();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(), "yyyy-MM-01");

  const { data: employees, isPending: employeesPending } = useGetList<Employee>(
    "employees",
    { pagination: { page: 1, perPage: 500 }, sort: { field: "first_name", order: "ASC" } },
  );
  const { data: leaveRequests, isPending: leavePending } = useGetList<LeaveRequest>(
    "leave_requests",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "created_at", order: "DESC" },
      filter: { status: "pending" },
    },
  );
  const { data: todayAttendance, isPending: attendancePending } =
    useGetList<AttendanceRecord>("attendance_records", {
      pagination: { page: 1, perPage: 500 },
      filter: { date: today },
    });
  const { data: draftPayslips, isPending: payslipsPending } = useGetList<Payslip>(
    "payslips",
    {
      pagination: { page: 1, perPage: 500 },
      filter: { status: "draft", "created_at@gte": monthStart },
    },
  );

  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const e of employees ?? []) map.set(String(e.id), e);
    return map;
  }, [employees]);

  const stats = useMemo(() => {
    const active = (employees ?? []).filter((e) => e.status === "active");

    const byDept = new Map<string, number>();
    for (const e of active) {
      const key = e.department ?? "__none";
      byDept.set(key, (byDept.get(key) ?? 0) + 1);
    }
    const deptRows = [...byDept.entries()]
      .map(([key, value]) => ({
        key,
        label:
          key === "__none"
            ? translate("crm.hr.dashboard.no_department", { _: "Unassigned" })
            : key,
        value,
      }))
      .sort((a, b) => b.value - a.value);
    const maxDept = Math.max(1, ...deptRows.map((r) => r.value));

    const byAttendanceStatus = new Map<string, number>();
    for (const a of todayAttendance ?? []) {
      byAttendanceStatus.set(a.status, (byAttendanceStatus.get(a.status) ?? 0) + 1);
    }
    const attendanceRows = attendanceStatuses.map((s) => ({
      key: s.value,
      label: s.label,
      value: byAttendanceStatus.get(s.value) ?? 0,
    }));
    const maxAttendance = Math.max(1, ...attendanceRows.map((r) => r.value));

    const presentToday = byAttendanceStatus.get("present") ?? 0;
    const onLeaveToday = byAttendanceStatus.get("on-leave") ?? 0;

    return {
      headcount: active.length,
      deptRows,
      maxDept,
      attendanceRows,
      maxAttendance,
      presentToday,
      onLeaveToday,
    };
  }, [employees, todayAttendance, attendanceStatuses, translate]);

  const isPending =
    employeesPending || leavePending || attendancePending || payslipsPending;

  if (isPending) {
    return (
      <div className="mt-2 flex flex-col gap-4 pb-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
        {translate("crm.hr.dashboard.no_data", {
          _: "Add an employee to see an overview here.",
        })}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.hr.dashboard.title", { _: "HR Overview" })}
        </h1>
        <Link to="/employees" className="text-sm text-primary hover:underline">
          {translate("crm.hr.dashboard.view_employees", { _: "View all employees" })}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={<Users className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.hr.dashboard.headcount", { _: "Headcount" })}
          value={stats.headcount}
        />
        <StatTile
          icon={<ClipboardList className="w-4 h-4" style={{ color: STATUS.warning }} />}
          label={translate("crm.hr.dashboard.pending_leave", { _: "Pending Leave" })}
          value={leaveRequests?.length ?? 0}
          valueStyle={
            (leaveRequests?.length ?? 0) > 0 ? { color: STATUS.warning } : undefined
          }
        />
        <StatTile
          icon={<CalendarCheck className="w-4 h-4" style={{ color: STATUS.good }} />}
          label={translate("crm.hr.dashboard.present_today", { _: "Present Today" })}
          value={stats.presentToday}
        />
        <StatTile
          icon={<Receipt className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.hr.dashboard.draft_payslips", { _: "Draft Payslips" })}
          value={draftPayslips?.length ?? 0}
        />
      </div>

      {leaveRequests && leaveRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.hr.dashboard.pending_leave_requests", {
                _: "Pending Leave Requests",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("resources.employees.name", { smart_count: 1 })}</TableHead>
                    <TableHead>{translate("resources.leave_requests.fields.leave_type")}</TableHead>
                    <TableHead>{translate("resources.leave_requests.fields.from_date")}</TableHead>
                    <TableHead>{translate("resources.leave_requests.fields.to_date")}</TableHead>
                    <TableHead>{translate("resources.leave_requests.fields.days")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((lr) => {
                    const emp = employeeById.get(String(lr.employee_id));
                    return (
                      <TableRow key={lr.id}>
                        <TableCell>
                          <Link
                            to={`/leave_requests`}
                            className="hover:underline"
                          >
                            {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{lr.leave_type}</TableCell>
                        <TableCell className="whitespace-nowrap">{lr.from_date}</TableCell>
                        <TableCell className="whitespace-nowrap">{lr.to_date}</TableCell>
                        <TableCell className="tabular-nums">{lr.days ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.hr.dashboard.attendance_today", { _: "Today's Attendance" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.attendanceRows.every((r) => r.value === 0) ? (
              <p className="text-sm text-muted-foreground">
                {translate("crm.hr.dashboard.no_attendance_today", {
                  _: "No attendance recorded yet today.",
                })}
              </p>
            ) : (
              stats.attendanceRows.map((row, i) => (
                <RankedRow
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  max={stats.maxAttendance}
                  color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.hr.dashboard.headcount_by_department", {
                _: "Headcount by Department",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.deptRows.map((row, i) => (
              <RankedRow
                key={row.key}
                label={row.label}
                value={row.value}
                max={stats.maxDept}
                color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

HrDashboard.path = "/hr";
