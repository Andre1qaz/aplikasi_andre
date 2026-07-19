import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

// Heuristic #5: Error Prevention — validate enrollment code before processing

export class EnrollCourseDto {
  @IsString()
  @IsNotEmpty()
  enrollmentCode: string;
}
