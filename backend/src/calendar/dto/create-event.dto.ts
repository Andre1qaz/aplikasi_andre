import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength, IsEnum } from 'class-validator';
import { CalendarEventType } from '@prisma/client';

// Heuristic #5: Error Prevention — validate event data before creation
// Heuristic #6: Recognition Rather Than Recall — clear event types

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(CalendarEventType)
  @IsOptional()
  type?: CalendarEventType;

  @IsString()
  @IsOptional()
  courseId?: string;
}
