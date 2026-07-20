"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarEvent, getCalendarEvents, createCalendarEvent, deleteCalendarEvent, getUpcomingDeadlines } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Heuristic #1: Visibility of System Status — loading states and error handling
// Heuristic #6: Recognition Rather Than Recall — clear upcoming deadlines section

interface CalendarClientProps {
  role: string;
  token: string;
  userId: string;
}

export function CalendarClient({ role, token, userId }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsData, deadlinesData] = await Promise.all([
        getCalendarEvents(token),
        getUpcomingDeadlines(token),
      ]);
      setEvents(eventsData.data || []);
      setUpcomingDeadlines(deadlinesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kalender");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const handleCreateEvent = async (data: {
    title: string;
    description?: string;
    startDate: string;
    type: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
    courseId?: string;
  }) => {
    await createCalendarEvent(token, data);
    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteCalendarEvent(token, eventId);
    await fetchEvents();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/50">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Gagal memuat kalender</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Deadline Mendekat (7 Hari ke Depan)
            </h3>
            <Badge variant="secondary" className="ml-auto">
              {upcomingDeadlines.length} event
            </Badge>
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: deadline.course?.thumbnailColor || "#e07a5f" }}
                  />
                  <div>
                    <p className="font-medium text-sm">{deadline.title}</p>
                    {deadline.course && (
                      <p className="text-xs text-muted-foreground">
                        {deadline.course.code} - {deadline.course.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    {new Date(deadline.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(deadline.date).toLocaleDateString("id-ID", { weekday: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <CalendarView
        events={events}
        onEventCreate={handleCreateEvent}
        onEventDelete={handleDeleteEvent}
        canCreate={true}
        userRole={role}
        courses={[]}
      />
    </div>
  );
}
