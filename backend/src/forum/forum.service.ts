import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

// Heuristic #1: Visibility of System Status — clear error messages for forum operations
// Heuristic #5: Error Prevention — validate thread ownership before modification
// Heuristic #18: Collaborative Learning — support threaded discussions with clear hierarchy

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  private async verifyCourseForumAccess(
    courseId: string,
    userId: string,
    userRole?: Role,
  ) {
    if (userRole === Role.ADMIN) {
      return;
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment && course.instructorId !== userId) {
      throw new ForbiddenException('You do not have access to this course forum');
    }
  }

  /**
   * Get all forum threads for a course
   */
  async getCourseThreads(courseId: string, userId: string, userRole?: Role) {
    await this.verifyCourseForumAccess(courseId, userId, userRole);
    const threads = await this.prisma.forumThread.findMany({
      where: { courseId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Mark threads with unread replies for the current user
    const threadsWithUnread = threads.map((thread) => {
      if (!userId) return { ...thread, unreadCount: 0 };

      const userReplies = thread.replies.filter((r) => r.authorId === userId);
      const lastUserReply = userReplies.length > 0 ? userReplies[userReplies.length - 1] : null;
      
      let unreadCount = 0;
      if (lastUserReply) {
        unreadCount = thread.replies.filter(
          (r) => new Date(r.createdAt) > new Date(lastUserReply.createdAt) && r.authorId !== userId
        ).length;
      } else {
        unreadCount = thread.replies.filter((r) => r.authorId !== userId).length;
      }

      return { ...thread, unreadCount };
    });

    return {
      success: true,
      data: threadsWithUnread,
      message: 'Forum threads retrieved successfully',
    };
  }

  /**
   * Get a single forum thread with replies
   */
  async getThread(threadId: string, userId: string, userRole?: Role) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.verifyCourseForumAccess(thread.courseId, userId, userRole);

    return {
      success: true,
      data: thread,
      message: 'Thread retrieved successfully',
    };
  }

  /**
   * Create a new forum thread
   */
  async createThread(userId: string, courseId: string, data: {
    title: string;
    content: string;
  }) {
    // Verify user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    // Also check if user is the instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!enrollment && (!course || course.instructorId !== userId)) {
      throw new ForbiddenException('You must be enrolled in this course to create a thread');
    }

    const thread = await this.prisma.forumThread.create({
      data: {
        courseId,
        authorId: userId,
        title: data.title,
        content: data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      success: true,
      data: thread,
      message: 'Thread created successfully',
    };
  }

  /**
   * Update a forum thread
   * Only thread author can update
   */
  async updateThread(userId: string, threadId: string, data: {
    title?: string;
    content?: string;
  }) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only update your own threads');
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedThread,
      message: 'Thread updated successfully',
    };
  }

  /**
   * Delete a forum thread
   * Only thread author or course instructor can delete
   */
  async deleteThread(userId: string, userRole: string, threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Check permission
    if (thread.authorId !== userId && thread.course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own threads');
    }

    await this.prisma.forumThread.delete({
      where: { id: threadId },
    });

    return {
      success: true,
      data: null,
      message: 'Thread deleted successfully',
    };
  }

  /**
   * Pin/unpin a thread (instructor only)
   */
  async togglePinThread(userId: string, userRole: string, threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only course instructor can pin threads');
    }

    const updatedThread = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedThread,
      message: `Thread ${updatedThread.isPinned ? 'pinned' : 'unpinned'} successfully`,
    };
  }

  /**
   * Add a reply to a thread
   */
  async createReply(userId: string, threadId: string, content: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Verify user is enrolled in the course or is the instructor
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: thread.courseId,
        },
      },
    });

    if (!enrollment && thread.course.instructorId !== userId) {
      throw new ForbiddenException('You must be enrolled in this course to reply');
    }

    const reply = await this.prisma.forumReply.create({
      data: {
        threadId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      data: reply,
      message: 'Reply created successfully',
    };
  }

  /**
   * Update a reply
   * Only reply author can update
   */
  async updateReply(userId: string, replyId: string, content: string) {
    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.authorId !== userId) {
      throw new ForbiddenException('You can only update your own replies');
    }

    const updatedReply = await this.prisma.forumReply.update({
      where: { id: replyId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedReply,
      message: 'Reply updated successfully',
    };
  }

  /**
   * Delete a reply
   * Only reply author or course instructor can delete
   */
  async deleteReply(userId: string, userRole: string, replyId: string) {
    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
      include: {
        thread: {
          include: { course: true },
        },
      },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Check permission
    if (reply.authorId !== userId && reply.thread.course.instructorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.prisma.forumReply.delete({
      where: { id: replyId },
    });

    return {
      success: true,
      data: null,
      message: 'Reply deleted successfully',
    };
  }
}
