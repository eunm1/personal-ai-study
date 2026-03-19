import { Module } from '@nestjs/common';
import { ImageGenerationService } from './image-generation.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { AiModule } from 'src/ai/ai.module'; // AiService를 쓰기 위해 필요

@Module({
  imports: [AiModule], // 영문 프롬프트 생성을 위해 AiService가 필요하다면 추가
  providers: [ImageGenerationService, SupabaseStorageService],
  exports: [ImageGenerationService, SupabaseStorageService], // 👈 다른 모듈에서 쓸 수 있게 내보내기!
})
export class ImageGenerationModule {}