import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // .env 사용을 위해 필수!
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { AiModule } from './ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { ImageGenerationModule } from './image-generation/image-genration.module';
import { PostAnalysisService } from './post-analysis/post-analysis.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // 1. .env 파일을 읽어오기 위한 설정 (가장 위에 두세요!)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. BullMQ 창고(Redis) 연결 설정
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),
    //3. EventEmitter 등록
    EventEmitterModule.forRoot(),
    PostModule, CategoryModule, PrismaModule, AiModule, ImageGenerationModule,
  ],
  controllers: [AppController],
  providers: [AppService, PostAnalysisService],
})
export class AppModule {}
