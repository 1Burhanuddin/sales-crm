import { isPast, parseISO } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Users,
} from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useMemo } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
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
import type { Issue, Project, Sale } from "../types";

// Same sequential blue ramp used on the Accounts dashboard (validated
// palette, see accounts/AccountsDashboard.tsx) -- kept identical across
// dashboards so "longer bar = more" reads the same way everywhere.
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
const STATUS_COLORS = {
  good: "#0ca30c",
  critical: "#d03b3b",
};

const OPEN_STATUSES = ["todo", "in-progress", "in-review"];

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

export const PmDashboard = () => {
  const translate = useTranslate();
  const { issueStatuses, issuePriorities } = useConfigurationContext();

  const { data: projects, isPending: projectsPending } = useGetList<Project>(
    "projects",
    { pagination: { page: 1, perPage: 200 }, sort: { field: "created_at", order: "DESC" } },
  );
  const { data: issues, isPending: issuesPending } = useGetList<Issue>(
    "issues",
    { pagination: { page: 1, perPage: 1000 }, sort: { field: "created_at", order: "DESC" } },
  );
  const { data: sales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
  });

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects ?? []) map.set(String(p.id), p.name);
    return map;
  }, [projects]);

  const salesNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sales ?? []) map.set(String(s.id), `${s.first_name} ${s.last_name}`);
    return map;
  }, [sales]);

  const statusLabel = useMemo(() => {
    const map = new Map(issueStatuses.map((s) => [s.value, s.label]));
    return (v: string) => map.get(v) ?? v;
  }, [issueStatuses]);
  const priorityLabel = useMemo(() => {
    const map = new Map(issuePriorities.map((p) => [p.value, p.label]));
    return (v: string) => map.get(v) ?? v;
  }, [issuePriorities]);

  const stats = useMemo(() => {
    const allIssues = issues ?? [];
    const openIssues = allIssues.filter((i) => OPEN_STATUSES.includes(i.status));
    const overdueIssues = allIssues.filter(
      (i) =>
        i.due_date &&
        i.status !== "done" &&
        isPast(parseISO(i.due_date)),
    );

    const byStatus = new Map<string, number>();
    for (const i of allIssues) byStatus.set(i.status, (byStatus.get(i.status) ?? 0) + 1);
    const statusRows = issueStatuses.map((s) => ({
      key: s.value,
      label: s.label,
      value: byStatus.get(s.value) ?? 0,
    }));
    const maxStatus = Math.max(1, ...statusRows.map((r) => r.value));

    const byPriority = new Map<string, number>();
    for (const i of allIssues) {
      const key = i.priority ?? "__none";
      byPriority.set(key, (byPriority.get(key) ?? 0) + 1);
    }
    const priorityRows = [
      ...issuePriorities.map((p) => ({
        key: p.value,
        label: p.label,
        value: byPriority.get(p.value) ?? 0,
      })),
    ].filter((r) => r.value > 0);
    const maxPriority = Math.max(1, ...priorityRows.map((r) => r.value));

    const byAssignee = new Map<string, number>();
    for (const i of openIssues) {
      const key = i.assignee_id ? String(i.assignee_id) : "__unassigned";
      byAssignee.set(key, (byAssignee.get(key) ?? 0) + 1);
    }
    const assigneeRows = [...byAssignee.entries()]
      .map(([key, value]) => ({
        key,
        label:
          key === "__unassigned"
            ? translate("crm.pm.dashboard.unassigned", { _: "Unassigned" })
            : (salesNameById.get(key) ?? key),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const maxAssignee = Math.max(1, ...assigneeRows.map((r) => r.value));

    const recentIssues = allIssues.slice(0, 8);

    return {
      totalProjects: projects?.length ?? 0,
      totalIssues: allIssues.length,
      openCount: openIssues.length,
      overdueIssues,
      statusRows,
      maxStatus,
      priorityRows,
      maxPriority,
      assigneeRows,
      maxAssignee,
      recentIssues,
    };
  }, [issues, projects, issueStatuses, issuePriorities, salesNameById, translate]);

  const isPending = projectsPending || issuesPending;

  if (isPending) {
    return (
      <div className="mt-2 max-w-5xl mx-auto flex flex-col gap-4 pb-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
        {translate("crm.pm.dashboard.no_data", {
          _: "Create a project to see an overview here.",
        })}
      </div>
    );
  }

  return (
    <div className="mt-2 max-w-5xl mx-auto flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.pm.dashboard.title", { _: "Projects Overview" })}
        </h1>
        <Link to="/projects" className="text-sm text-primary hover:underline">
          {translate("crm.pm.dashboard.view_projects", { _: "View all projects" })}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={<FolderKanban className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.pm.dashboard.total_projects", { _: "Projects" })}
          value={stats.totalProjects}
        />
        <StatTile
          icon={<ListTodo className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.pm.dashboard.open_issues", { _: "Open Issues" })}
          value={stats.openCount}
        />
        <StatTile
          icon={<CheckCircle2 className="w-4 h-4" style={{ color: STATUS_COLORS.good }} />}
          label={translate("crm.pm.dashboard.total_issues", { _: "Total Issues" })}
          value={stats.totalIssues}
        />
        <StatTile
          icon={<AlertTriangle className="w-4 h-4" style={{ color: STATUS_COLORS.critical }} />}
          label={translate("crm.pm.dashboard.overdue_issues", { _: "Overdue" })}
          value={stats.overdueIssues.length}
          valueStyle={
            stats.overdueIssues.length > 0 ? { color: STATUS_COLORS.critical } : undefined
          }
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.pm.dashboard.by_status", { _: "Issues by Status" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.statusRows.map((row, i) => (
              <RankedRow
                key={row.key}
                label={row.label}
                value={row.value}
                max={stats.maxStatus}
                color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.pm.dashboard.by_priority", { _: "Issues by Priority" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.priorityRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {translate("crm.pm.dashboard.no_priority_data", { _: "No data yet." })}
              </p>
            ) : (
              stats.priorityRows.map((row, i) => (
                <RankedRow
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  max={stats.maxPriority}
                  color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <Users className="w-4 h-4" />
            {translate("crm.pm.dashboard.workload", { _: "Open Issues by Assignee" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {stats.assigneeRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.pm.dashboard.no_open_issues", { _: "No open issues." })}
            </p>
          ) : (
            stats.assigneeRows.map((row, i) => (
              <RankedRow
                key={row.key}
                label={row.label}
                value={row.value}
                max={stats.maxAssignee}
                color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
              />
            ))
          )}
        </CardContent>
      </Card>

      {stats.overdueIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-destructive">
              {translate("crm.pm.dashboard.overdue_issues", { _: "Overdue" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("resources.issues.fields.title")}</TableHead>
                    <TableHead>{translate("resources.projects.name", { smart_count: 1 })}</TableHead>
                    <TableHead>{translate("resources.issues.fields.assignee_id")}</TableHead>
                    <TableHead>{translate("resources.issues.fields.due_date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.overdueIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="max-w-[240px] truncate">
                        <Link
                          to={`/projects/${issue.project_id}/issues/${issue.id}/show`}
                          className="hover:underline"
                        >
                          {issue.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {projectNameById.get(String(issue.project_id)) ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {issue.assignee_id
                          ? (salesNameById.get(String(issue.assignee_id)) ?? "—")
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="destructive">{issue.due_date}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {translate("crm.pm.dashboard.recent_activity", { _: "Recent Issues" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("resources.issues.fields.title")}</TableHead>
                  <TableHead>{translate("resources.projects.name", { smart_count: 1 })}</TableHead>
                  <TableHead>{translate("resources.issues.fields.status")}</TableHead>
                  <TableHead>{translate("resources.issues.fields.priority")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="max-w-[240px] truncate">
                      <Link
                        to={`/projects/${issue.project_id}/issues/${issue.id}/show`}
                        className="hover:underline"
                      >
                        {issue.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {projectNameById.get(String(issue.project_id)) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {statusLabel(issue.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {issue.priority ? priorityLabel(issue.priority) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

PmDashboard.path = "/pm";
