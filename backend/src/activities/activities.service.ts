import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Role, ActivityStatus } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findByWeek(weekId: string, userId: string, userRole: Role) {
    // Check if user has access to the week's course
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
      include: { course: true },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    await this.checkCourseAccess(week.courseId, userId, userRole);

    // Students only see published activities
    const whereClause = userRole === Role.MAHASISWA
      ? { weekId, status: ActivityStatus.PUBLISHED }
      : { weekId };

    return this.prisma.activity.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { week: { include: { course: true } } },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check if user has access to the course
    await this.checkCourseAccess(activity.week.courseId, userId, userRole);

    // Students cannot see draft activities
    if (userRole === Role.MAHASISWA && activity.status === ActivityStatus.DRAFT) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    return activity;
  }

  async create(weekId: string, dto: CreateActivityDto, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can create activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can create activities');
    }

    // Check if week exists and user has access
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
      include: { course: true },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    await this.checkCourseAccess(week.courseId, userId, userRole);

    return this.prisma.activity.create({
      data: {
        weekId,
        ...dto,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateActivityDto, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can update activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can update activities');
    }

    const activity = await this.findOne(id, userId, userRole);

    // Update publishedAt if status is being changed to PUBLISHED
    const updateData: any = { ...dto };
    if (dto.status === 'PUBLISHED' && activity.status !== ActivityStatus.PUBLISHED) {
      updateData.publishedAt = new Date().toISOString();
    }

    return this.prisma.activity.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can delete activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can delete activities');
    }

    const activity = await this.findOne(id, userId, userRole);

    return this.prisma.activity.delete({
      where: { id },
    });
  }

  async duplicate(id: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can duplicate activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can duplicate activities');
    }

    const activity = await this.findOne(id, userId, userRole);

    const { id: _, createdAt, updatedAt, publishedAt, week, metadata, ...activityData } = activity;

    return this.prisma.activity.create({
      data: {
        ...activityData,
        title: `${activity.title} (Copy)`,
        status: ActivityStatus.DRAFT,
        publishedAt: null,
        metadata: metadata as any,
      },
    });
  }

  async move(id: string, newWeekId: string, userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can move activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can move activities');
    }

    const activity = await this.findOne(id, userId, userRole);

    // Check if new week exists and user has access
    const newWeek = await this.prisma.week.findUnique({
      where: { id: newWeekId },
      include: { course: true },
    });

    if (!newWeek) {
      throw new NotFoundException('Target week not found');
    }

    await this.checkCourseAccess(newWeek.courseId, userId, userRole);

    return this.prisma.activity.update({
      where: { id },
      data: { weekId: newWeekId },
    });
  }

  async reorder(weekId: string, activityOrders: { id: string; order: number }[], userId: string, userRole: Role) {
    // Only ADMIN and DOSEN can reorder activities
    if (userRole !== Role.ADMIN && userRole !== Role.DOSEN) {
      throw new ForbiddenException('Only Admin and Dosen can reorder activities');
    }

    // Check if user has access to the week
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
      include: { course: true },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    await this.checkCourseAccess(week.courseId, userId, userRole);

    // Update orders in a transaction
    return this.prisma.$transaction(
      activityOrders.map(({ id, order }) =>
        this.prisma.activity.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  private async checkCourseAccess(courseId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Admin has access to all courses
    if (userRole === Role.ADMIN) {
      return;
    }

    // Dosen can only access their own courses
    if (userRole === Role.DOSEN) {
      if (course.instructorId !== userId) {
        throw new ForbiddenException('You do not have access to this course');
      }
      return;
    }

    // Mahasiswa can only access enrolled courses
    if (userRole === Role.MAHASISWA) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
      return;
    }

    throw new ForbiddenException('You do not have access to this course');
  }
}
