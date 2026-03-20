// post.processor.ts
import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { AiService } from 'src/ai/ai.service';
import { ImageGenerationService } from 'src/image-generation/image-generation.service';
import { SupabaseStorageService } from 'src/image-generation/supabase-storage.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryService } from 'src/category/category.service';
import { PostJob, AnalyzeTextJob, SaveDataJob, GenerateImageJob, UploadImageJob } from 'src/types/job-types';
import axios from 'axios';

@Processor('post-tasks', {
  lockDuration: 60000, // 60초로 상향
  concurrency: 1,      // 한 번에 하나씩 처리 (필요시 조절)
})
export class PostProcessor extends WorkerHost{ //WorkerHost는 클래스 하나가 딱 하나의 거대한 process() 메서드만 가질 때 사용
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService, // 1단계용 (Gemini)
    private readonly imageService: ImageGenerationService, // 2단계용 (Leonardo)
    private readonly supabaseStorage: SupabaseStorageService, // 3단계용
    private readonly categoryService: CategoryService, // 👈 주입(Injection)
    @InjectQueue('post-tasks') private postQueue: Queue, // 다음 체인을 호출하기 위해 주입
  ) {
    super(); 
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`✅ 작업 완료: ${job.name} (ID: ${job.id})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`🚨 작업 실패: ${job.name} (ID: ${job.id}) | 사유: ${error.message}`);
  }

  async process(job: PostJob): Promise<void> {
    try {
        
      switch (job.name) {
        case 'analyze-text':
          return this.handleAnalysis(job as Job<AnalyzeTextJob>);
        case 'save-data':
          return this.handleSaveData(job as Job<SaveDataJob>);
        case 'generate-image':
          return this.handleImage(job as Job<GenerateImageJob>);
        case 'upload-image':
          return this.handleUpload(job as Job<UploadImageJob>);
        default:
          throw new Error(`정의되지 않은 작업입니다: ${job['name']}`);
      }
    } catch (error) {
      // 여기서 에러를 잡아야 터미널에 찍힙니다!
      console.error(`❌ [${job.name}] 처리 중 에러 발생:`, error);
      throw error; // BullMQ가 재시도(Retry)할 수 있게 다시 던져줍니다.
    }
  }

  // 1단계: 텍스트 분석 (Gemini)
  async handleAnalysis(job: Job<AnalyzeTextJob>) {
    const { postId, style, content } = job.data;
    // Gemini 호출 -> PostAnalysis에 summary, imagePrompt 저장
    const analysis = await this.aiService.analyzePost(content, style);

    await this.postQueue.add('save-data', { 
      postId, 
      ...analysis, // summary, category, imagePrompt
      style });
  }

  // 2단계: DB 저장 및 카테고리 매핑 (DB 작업 전용)
  async handleSaveData(job: Job<SaveDataJob>) {
    const { postId, summary, category, imagePrompt, style } = job.data;
    
    const categoryInfo = await this.categoryService.findOrCreateCategory(category);
    
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        categoryId: categoryInfo.id,
        analysis: {
          update: { summary, imagePrompt, style }
        }
      }
    });

    // 임시 URL 저장 및 상태 변경
    await this.prisma.postAnalysis.update({
      where: { postId },
      data: { status: 'GENERATING' }
    });

    // DB 저장 성공 시 3단계(이미지 생성)로 이동
    await this.postQueue.add('generate-image', { postId, imagePrompt });
  }

  // 3단계: 이미지 생성 (Leonardo)
  async handleImage(job: Job<GenerateImageJob>) {
    const { postId, imagePrompt } = job.data;

    // 레오나르도 API 호출 (비용 발생하는 구간!)
    const tempImageUrl = await this.imageService.generateImage(imagePrompt);
    
    // 다음 체인: 업로드로!
    await this.postQueue.add('upload-image', { postId, tempImageUrl });
  }

  // 4단계: 이미지 영구 저장 (Supabase)
  async handleUpload(job: Job<UploadImageJob>) {
    const { postId, tempImageUrl } = job.data;

    
    const analysis = await this.prisma.postAnalysis.findUnique({ where: { postId } });
    // 멱등성 체크: 이미 URL이 있다면 건너뛰기
    if (analysis.imageUrl) {
      return;
    }
    
    const imageRes = await axios.get(tempImageUrl, { responseType: 'arraybuffer' });

    // Supabase Storage에 업로드 (tempImageUrl -> 최종 imageUrl)
    const finalUrl = await this.supabaseStorage.uploadImage(postId, Buffer.from(imageRes.data));
    
    // 최종 업데이트 및 완료 처리
    await this.prisma.postAnalysis.update({
      where: { postId },
      data: { 
        imageUrl: finalUrl, 
        tempImageUrl: tempImageUrl,
        status: 'COMPLETED' 
      }
    });
  }
}