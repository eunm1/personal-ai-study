// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

@Module({
  providers: [AiService],
  exports: [AiService], // 다른 모듈에서 쓸 수 있게 공개!
})
export class AiModule {}