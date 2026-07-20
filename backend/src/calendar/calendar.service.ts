import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarEventType } from '@prisma/client';

// Heuristic #1: Visibility of System Status — clear error messages for calendar operations
// Heuristic #5: Error Prevention — validate event ownership before modification
// Heuristic #6: Recognition Rather Than Recall — provide clear event categorization

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all calendar events for a user
   * Includes personal notes and course-related deadlines
   */
  async getUserEvents(userId: string, courseId?: string) {
    const where: any = {
      OR: [
        { userId: userId }, // Personal notes
        { userId: null, courseId: courseId }, // Course deadlines (if course specified)
        { userId: null, courseId: null }, // Global announcements
      ],
    };

    // If courseId is specified, also get events from that course
    if (courseId) {
      where.OR.push({ courseId: courseId });
    } else {
      // Get events from all enrolled courses
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e: any) => e.courseId);
      where.OR.push({ courseId: { in: courseIds } });
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      data: events,
      message: 'Calendar events retrieved successfully',
    };
  }

  /**
   * Get events for a specific month
   */
  async getEventsByMonth(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e: any) => e.courseId);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { userId: userId },
          { courseId: { in: courseIds } },
          { userId: null, courseId: null },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      data: events,
      message: 'Monthly calendar events retrieved successfully',
    };
  }

  /**
   * Create a new calendar event
   * Personal notes can be created by any user
   * Course deadlines can only be created by course instructor or admin
   */
  async createEvent(userId: string, userRole: string, data: {
    title: string;
    description?: string;
    date: Date;
    type?: CalendarEventType;
    courseId?: string;
  }) {
    // If courseId is provided, verify user has permission
    if (data.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Only instructor or admin can create course events
      if (userRole !== 'ADMIN' && course.instructorId !== userId) {
        throw new ForbiddenException('Only course instructor can create course events');
      }
    }

    const event = await this.prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        type: data.type || CalendarEventType.PERSONAL_NOTE,
        userId: data.courseId ? null : userId, // Personal notes have userId, course events don't
        courseId: data.courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
    });

    return {
      success: true,
      data: event,
      message: 'Calendar event created successfully',
    };
  }

  /**
   * Update a calendar event
   * Only event creator (for personal notes) or course instructor (for course events) can update
   */
  async updateEvent(userId: string, userRole: string, eventId: string, data: {
    title?: string;
    description?: string;
    date?: Date;
    type?: CalendarEventType;
  }) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { course: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permission
    if (event.userId) {
      // Personal note - only owner can update
      if (event.userId !== userId) {
        throw new ForbiddenException('You can only update your own personal notes');
      }
    } else if (event.courseId) {
      // Course event - only instructor or admin can update
      if (userRole !== 'ADMIN' && event.course?.instructorId !== userId) {
        throw new ForbiddenException('Only course instructor can update course events');
      }
    } else {
      // Global announcement - only admin can update
      if (userRole !== 'ADMIN') {
        throw new ForbiddenException('Only admin can update global announcements');
      }
    }

    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedEvent,
      message: 'Calendar event updated successfully',
    };
  }

  /**
   * Delete a calendar event
   * Only event creator (for personal notes) or course instructor (for course events) can delete
   */
  async deleteEvent(userId: string, userRole: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { course: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permission
    if (event.userId) {
      // Personal note - only owner can delete
      if (event.userId !== userId) {
        throw new ForbiddenException('You can only delete your own personal notes');
      }
    } else if (event.courseId) {
      // Course event - only instructor or admin can delete
      if (userRole !== 'ADMIN' && event.course?.instructorId !== userId) {
        throw new ForbiddenException('Only course instructor can delete course events');
      }
    } else {
      // Global announcement - only admin can delete
      if (userRole !== 'ADMIN') {
        throw new ForbiddenException('Only admin can delete global announcements');
      }
    }

    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return {
      success: true,
      data: null,
      message: 'Calendar event deleted successfully',
    };
  }

  /**
   * Get upcoming deadlines (next 7 days)
   */
  async getUpcomingDeadlines(userId: string) {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e: any) => e.courseId);

    const deadlines = await this.prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: today,
          lte: nextWeek,
        },
        type: CalendarEventType.DEADLINE,
        OR: [
          { courseId: { in: courseIds } },
          { userId: null, courseId: null },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            thumbnailColor: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      data: deadlines,
      message: 'Upcoming deadlines retrieved successfully',
    };
  }
}
