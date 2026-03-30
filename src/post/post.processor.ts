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
import { EventEmitter2 } from '@nestjs/event-emitter';

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
    private eventEmitter: EventEmitter2,
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

  private emitProgress(tempUserId: string, status: string, percent: string, extra = {}) {
    this.eventEmitter.emit('post.status', {
      tempUserId,
      status,
      percent,
      ...extra
    });
  }

  async process(job: PostJob): Promise<void> {
    try {
        
      switch (job.name) {
        case 'analyze-text':
          await this.handleAnalysis(job as Job<AnalyzeTextJob>);
          break;
        case 'save-data':
          await this.handleSaveData(job as Job<SaveDataJob>);
          break;
        case 'generate-image':
          await this.handleImage(job as Job<GenerateImageJob>);
          break;
        case 'upload-image':
          await this.handleUpload(job as Job<UploadImageJob>);
          break;
        default:
          throw new Error(`정의되지 않은 작업입니다: ${job['name']}`);
      }
    } catch (error) {
      // 여기서 에러를 잡아야 터미널에 찍힙니다!
      console.error(`❌ [${job.name}] 처리 중 에러 발생:`, error);

      const { postId, tempUserId } = job.data;

      // DB 상태를 FAILED로 변경 (선택 사항)
      await this.prisma.postAnalysis.update({
        where: { postId },
        data: { status: 'FAILED' }
      });

      // 📢 방송국에 "실패했어!"라고 알림
      this.eventEmitter.emit('post.status', {
        tempUserId,
        postId,
        imageUrl: '',
        status: 'FAILED', // 👈 여기를 FAILED로!
        title: '분석 실패'
      });

      const maxAttempts = job.opts.attempts || 1;
      // const isFinalAttempt = (job.attemptsMade + 1) >= maxAttempts;
      console.warn(`⚠️ [재시도 대기] ${maxAttempts - (job.attemptsMade + 1)}번의 기회가 더 남았습니다.`);

      throw error; // BullMQ가 재시도(Retry)할 수 있게 다시 던져줍니다.
    }
  }

  // 1단계: 텍스트 분석 (Gemini)
  async handleAnalysis(job: Job<AnalyzeTextJob>) {
    const { postId, style, content, tempUserId } = job.data;
    this.emitProgress(tempUserId, 'ANALYZING', '33', {postId});
    // Gemini 호출 -> PostAnalysis에 summary, imagePrompt 저장
    const analysis = await this.aiService.analyzePost(content, style);

    await this.postQueue.add('save-data', { 
      postId, 
      tempUserId,
      ...analysis, // summary, category, imagePrompt
      style });
  }

  // 2단계: DB 저장 및 카테고리 매핑 (DB 작업 전용)
  async handleSaveData(job: Job<SaveDataJob>) {
    const { postId, summary, category, imagePrompt, style, tempUserId } = job.data;
    
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
    await this.postQueue.add('generate-image', { postId, imagePrompt, tempUserId });
  }

  // 3단계: 이미지 생성 (Leonardo)
  async handleImage(job: Job<GenerateImageJob>) {
    const { postId, imagePrompt, tempUserId } = job.data;
    this.emitProgress(tempUserId, 'GENERATING', '66', {postId});

    // 레오나르도 API 호출 (비용 발생하는 구간!)
    const tempImageUrl = await this.imageService.generateImage(imagePrompt);
    
    // 다음 체인: 업로드로!
    await this.postQueue.add('upload-image', { postId, tempUserId, tempImageUrl });
  }

  // 4단계: 이미지 영구 저장 (Supabase)
  async handleUpload(job: Job<UploadImageJob>) {
    const { postId, tempUserId, tempImageUrl } = job.data;
    
    const analysis = await this.prisma.postAnalysis.findUnique({ where: { postId } });
    // 멱등성 체크: 이미 URL이 있다면 건너뛰기
    if (tempImageUrl == analysis.tempImageUrl) {
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

    // 2. 👿 스토리지에 이미 있는 이미지 삭제
    const initimageUrl = analysis.imageUrl;
    if (initimageUrl) {
      // URL에서 파일명만 추출하는 로직이 필요할 수 있습니다.
      // 예: https://.../post-images/uuid_image.png -> 'uuid_image.png'
      const fileName = initimageUrl.split('/').pop(); 
      
      if (fileName) {
        await this.supabaseStorage.deleteImage(fileName);
      }
    }

    // ✅ DB 업데이트 완료 후 이벤트 발생
    this.emitProgress(tempUserId, 'COMPLETED', '66', {postId: postId, imageUrl: finalUrl});

  }
}