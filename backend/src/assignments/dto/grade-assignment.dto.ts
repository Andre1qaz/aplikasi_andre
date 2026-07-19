import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

// Heuristic #16: Instructional Assessment — detailed feedback for grading

export class GradeAssignmentDto {
  @IsNumber()
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  feedback?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rubricNotes?: string;
}
