import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

// Heuristic #5: Error Prevention — validate submission data

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  answer?: string; // For MC and Short Answer

  @IsString()
  @IsOptional()
  essayAnswer?: string; // For Essay questions
}

export class SubmitExamDto {
  @IsArray()
  @IsNotEmpty()
  answers: AnswerDto[];
}
