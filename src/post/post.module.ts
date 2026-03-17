import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AiModule } from 'src/ai/ai.module';
import { CategoryModule } from 'src/category/category.module'; // 추가

@Module({
  imports: [AiModule, CategoryModule], // AI,, CategoryModule 모듈 주입!
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
