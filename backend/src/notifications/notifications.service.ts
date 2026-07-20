import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

// Heuristic #1: Visibility of System Status — clear notification creation and retrieval
// Heuristic #20: Feedback and Assessment — automatic notifications for grades
// Heuristic #18: Collaborative Learning — notifications for forum replies

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    return {
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      success: true,
      data: { count },
      message: 'Unread count retrieved successfully',
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      success: true,
      data: null,
      message: 'Notification marked as read',
    };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      success: true,
      data: null,
      message: 'All notifications marked as read',
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      data: null,
      message: 'Notification deleted successfully',
    };
  }

  /**
   * Create a notification (internal method for job queue)
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data,
    });

    return notification;
  }

  /**
   * Create notification for multiple users (bulk)
   */
  async createBulkNotifications(data: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notifications = await this.prisma.notification.createMany({
      data: data.userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      })),
    });

    return notifications;
  }

  /**
   * Create deadline reminder notification
   */
  async createDeadlineReminder(userId: string, assignmentTitle: string, courseName: string, deadlineDate: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Reminder Deadline Tugas',
      message: `Tugas "${assignmentTitle}" di course "${courseName}" akan berakhir pada ${deadlineDate.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create exam reminder notification
   */
  async createExamReminder(userId: string, examTitle: string, courseName: string, examDate: Date) {
    return this.createNotification({
      userId,
      type: NotificationType.EXAM_REMINDER,
      title: 'Reminder Ujian',
      message: `Ujian "${examTitle}" di course "${courseName}" akan dimulai pada ${examDate.toLocaleDateString('id-ID')}`,
      link: '/mahasiswa/exams',
    });
  }

  /**
   * Create grade released notification
   */
  async createGradeReleased(userId: string, itemType: string, itemName: string, courseName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.GRADE_RELEASED,
      title: 'Nilai Telah Keluar',
      message: `Nilai ${itemType} "${itemName}" di course "${courseName}" telah keluar`,
      link: '/mahasiswa/courses',
    });
  }

  /**
   * Create forum reply notification
   */
  async createForumReplyNotification(userId: string, threadTitle: string, replierName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.FORUM_REPLY,
      title: 'Balasan Baru di Forum',
      message: `${replierName} membalas diskusi "${threadTitle}"`,
      link: '/mahasiswa/forum',
    });
  }
}
