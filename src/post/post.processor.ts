// post.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImageGenerationService } from 'src/image-generation/image-generation.service';
import { SupabaseStorageService } from 'src/image-generation/supabase-storage.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('post-tasks')
export class PostProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    if (job.name === 'generate-image') {
      const { postId, imagePrompt } = job.data;

      try {
        // 🎨 1. 은미 님이 만든 서비스로 이미지 생성 (Buffer 획득)
        const imageBuffer = await this.imageGenerationService.generateImage(imagePrompt);

        // ☁️ 2. Supabase Storage에 업로드 (URL 획득)
        const imageUrl = await this.supabaseStorage.uploadImage(postId, imageBuffer);

        // 💾 3. DB에 이미지 URL 업데이트
        await this.prisma.post.update({
          where: { id: postId },
          data: { imageUrl },
        });

      } catch (error) {
        console.error(`Post ${postId} 이미지 생성 실패:`, error);
      }
    }
  }
}