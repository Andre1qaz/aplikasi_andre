import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength, IsEnum, IsArray } from 'class-validator';
import { QuestionType } from '@prisma/client';

// Heuristic #5: Error Prevention — validate question data before creation
// Heuristic #16: Instructional Assessment — require correct answers for auto-grading

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  questionText: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  explanation?: string;

  @IsNumber()
  @IsNotEmpty()
  points: number;

  @IsString()
  @IsOptional()
  correctAnswer?: string; // For MC and Short Answer

  @IsArray()
  @IsOptional()
  options?: string[]; // For MC questions

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  rubric?: string; // For Essay questions
}
