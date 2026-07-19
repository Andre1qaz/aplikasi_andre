import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

// Heuristic #5: Error Prevention — validate category data before creation

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  academicYear?: string;

  @IsOptional()
  isActive?: boolean;
}
