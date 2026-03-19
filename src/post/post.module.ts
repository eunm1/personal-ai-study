import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AiModule } from 'src/ai/ai.module';
import { CategoryModule } from 'src/category/category.module'; // 추가
import { ImageGenerationModule } from 'src/image-generation/image-genration.module';
import { PostProcessor } from './post.processor';

@Module({
  imports: [
    AiModule, // AI, CategoryModule 모듈 주입!
    CategoryModule,
    ImageGenerationModule, // 👈 여기서 가져와야 Service와 Processor에서 쓸 수 있어요!
    BullModule.registerQueue({
      name: 'post-tasks', // 큐 이름 일치 확인!
    }),
  ], 
  controllers: [PostController],
  providers: [PostService, PostProcessor],
})
export class PostModule {}
