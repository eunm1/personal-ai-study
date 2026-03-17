import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService], // 3. 이 줄이 반드시 있어야 다른 모듈에서 쓸 수 있습니다!
})
export class CategoryModule {}
