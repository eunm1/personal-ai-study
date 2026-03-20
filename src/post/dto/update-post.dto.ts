import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsBoolean()
  @IsOptional()
  reAnalyze?: boolean; // 기본값은 undefined 또는 false로 취급됩니다.

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  category?: string;
  
  // 이미지는 보통 직접 수정하기보다 재생성하지만, 필요하다면 추가!
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
