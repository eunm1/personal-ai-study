import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsEnum
} from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePostAnalysisDto {

  @IsString()
  @IsOptional()
  style?: string; // "맘에 안 들어서 스타일만 바꾸고 싶어!" 할 때 사용

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus; // 재분석을 시작할 때 상태를 'PENDING'으로 돌리기 위해 사용

}
