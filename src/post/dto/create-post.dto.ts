import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';
import { IsCustomUrl, IsNonEmptyString } from 'src/validate-decorators';

export class CreatePostDto {
  @IsNonEmptyString()
  title: string;

  @IsNonEmptyString()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  // Transform(({ value }) => Number(value))
  //   @IsInt()
  //   @IsPositive()
  //   categoryId?: number;
}
