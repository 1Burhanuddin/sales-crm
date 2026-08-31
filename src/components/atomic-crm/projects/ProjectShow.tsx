import { useState } from "react";
import {
  ShowBase,
  useRecordContext,
  useShowContext,
  useTranslate,
  type Identifier,
} from "ra-core";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Project } from "../types";
import { IssueBoard } from "./IssueBoard";
import { MilestonePanel } from "./MilestonePanel";
import { SprintPanel } from "./SprintPanel";

export const ProjectShow = () => (
  <ShowBase>
    <ProjectShowContent />
  </ShowBase>
);

const ProjectShowContent = () => {
  const translate = useTranslate();
  const { isPending } = useShowContext<Project>();
  const record = useRecordContext<Project>();
  const [selectedSprintId, setSelectedSprintId] = useState<Identifier | null>(
    null,
  );
  const [selectedMilestoneId, setSelectedMilestoneId] =
    useState<Identifier | null>(null);
  // A sprint and a milestone filter the board the same way (both narrow
  // it to one dimension), so picking one clears the other rather than
  // ANDing them together -- combining "this sprint" with "this milestone"
  // would usually just show nothing and confuse which filter is active.
  const selectSprint = (id: Identifier | null) => {
    setSelectedSprintId(id);
    if (id != null) setSelectedMilestoneId(null);
  };
  const selectMilestone = (id: Identifier | null) => {
    setSelectedMilestoneId(id);
    if (id != null) setSelectedSprintId(null);
  };
  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-2">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">{record.name}</h2>
              {record.description && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {record.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link to={`/projects/${record.id}`}>
                  <Pencil className="w-4 h-4" />
                  {translate("ra.action.edit")}
                </Link>
              </Button>
              <DeleteButton redirect="list" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SprintPanel
            projectId={record.id}
            selectedSprintId={selectedSprintId}
            onSelectSprint={selectSprint}
          />
          <MilestonePanel
            projectId={record.id}
            selectedMilestoneId={selectedMilestoneId}
            onSelectMilestone={selectMilestone}
          />
        </CardContent>
      </Card>

      <IssueBoard
        projectId={record.id}
        sprintId={selectedSprintId}
        milestoneId={selectedMilestoneId}
      />
    </div>
  );
};
