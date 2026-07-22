import { IsString, IsInt, IsDateString, Min, Max } from 'class-validator';

export class CreateWeekDto {
  @IsInt()
  @Min(1)
  @Max(16)
  weekNumber: number;

  @IsString()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(0)
  order: number;
}
