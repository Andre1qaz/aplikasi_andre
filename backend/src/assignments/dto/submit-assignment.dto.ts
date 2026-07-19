import { IsString, IsNotEmpty } from 'class-validator';

// Heuristic #5: Error Prevention — validate submission data

export class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;
}
