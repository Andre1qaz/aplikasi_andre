import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mahasiswa1@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  name: string;

  @ApiProperty({ example: 'budi@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'budi@ecourse.ac.id' })
  @IsEmail({}, { message: 'Format email institusi tidak valid' })
  email: string;
}
