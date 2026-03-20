// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { CategoryModule } from 'src/category/category.module';

@Module({
  providers: [AiService, CategoryModule],
  exports: [AiService], // 다른 모듈에서 쓸 수 있게 공개!
})
export class AiModule {}