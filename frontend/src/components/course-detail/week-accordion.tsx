"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Plus, MoreVertical, Edit, Trash2, Copy, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActivityCard } from "./activity-card";
import { toast } from "sonner";

interface Week {
  id: string;
  weekNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  order: number;
  activities: Activity[];
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  metadata: any;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WeekAccordionProps {
  week: Week;
  isExpanded: boolean;
  onToggle: () => void;
  canEdit: boolean;
  onAddActivity: () => void;
  onActivityChange: () => void;
  token: string;
  userRole: string;
}

export function WeekAccordion({
  week,
  isExpanded,
  onToggle,
  canEdit,
  onAddActivity,
  onActivityChange,
  token,
  userRole,
}: WeekAccordionProps) {
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const publishedActivities = week.activities.filter((a) => a.status === "PUBLISHED");
  const draftActivities = week.activities.filter((a) => a.status === "DRAFT");

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">
                Week {week.weekNumber}: {week.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(week.startDate)} - {formatDate(week.endDate)}
                </span>
                {week.activities.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {week.activities.length} aktivitas
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 mt-4">
            {publishedActivities.length === 0 && draftActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada aktivitas di week ini
              </div>
            ) : (
              <>
                {publishedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    weekId={week.id}
                    canEdit={canEdit}
                    onEdit={() => {/* TODO: Edit activity */}}
                    onDelete={() => {/* TODO: Delete activity */}}
                    onDuplicate={() => {/* TODO: Duplicate activity */}}
                    onMove={() => {/* TODO: Move activity */}}
                    token={token}
                    userRole={userRole}
                    onChange={onActivityChange}
                  />
                ))}
                {canEdit && draftActivities.length > 0 && (
                  <>
                    <div className="text-sm text-muted-foreground font-medium mt-4 mb-2">
                      Draft ({draftActivities.length})
                    </div>
                    {draftActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        weekId={week.id}
                        canEdit={canEdit}
                        onEdit={() => {/* TODO: Edit activity */}}
                        onDelete={() => {/* TODO: Delete activity */}}
                        onDuplicate={() => {/* TODO: Duplicate activity */}}
                        onMove={() => {/* TODO: Move activity */}}
                        token={token}
                        userRole={userRole}
                        onChange={onActivityChange}
                      />
                    ))}
                  </>
                )}
              </>
            )}
            {canEdit && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={onAddActivity}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
