import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';

// Heuristic #1: Visibility of System Status — clear API responses for calendar operations
// Heuristic #5: Error Prevention — validate event data before processing
// Heuristic #6: Recognition Rather Than Recall — provide clear endpoint naming

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Get all calendar events for current user' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  async getUserEvents(
    @CurrentUser('sub') userId: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.calendarService.getUserEvents(userId, courseId);
  }

  @Get('month')
  @ApiOperation({ summary: 'Get calendar events for a specific month' })
  @ApiQuery({ name: 'year', required: true, description: 'Year (e.g., 2025)' })
  @ApiQuery({ name: 'month', required: true, description: 'Month (1-12)' })
  async getEventsByMonth(
    @CurrentUser('sub') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.calendarService.getEventsByMonth(
      userId,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming deadlines (next 7 days)' })
  async getUpcomingDeadlines(@CurrentUser('sub') userId: string) {
    return this.calendarService.getUpcomingDeadlines(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new calendar event' })
  async createEvent(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.calendarService.createEvent(
      userId,
      role,
      {
        title: createEventDto.title,
        description: createEventDto.description,
        date: new Date(createEventDto.startDate),
        type: createEventDto.type,
        courseId: createEventDto.courseId,
      },
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a calendar event' })
  async updateEvent(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') eventId: string,
    @Body() updateData: {
      title?: string;
      description?: string;
      date?: string;
      type?: any;
    },
  ) {
    return this.calendarService.updateEvent(
      userId,
      role,
      eventId,
      {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
      },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  async deleteEvent(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') eventId: string,
  ) {
    return this.calendarService.deleteEvent(userId, role, eventId);
  }
}
