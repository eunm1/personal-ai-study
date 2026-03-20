// types.ts
import { Job } from 'bullmq';

// 모든 작업의 공통 분모
interface BaseJobData {
  postId: number;
}

export interface AnalyzeTextJob extends BaseJobData{
  content: string;
  style: string;
}

export interface AiAnalysisResult {
  summary: string;
  category: string;
  imagePrompt?: string;
}

export interface SaveDataJob extends AiAnalysisResult, AnalyzeTextJob {}

export interface GenerateImageJob extends BaseJobData{
  imagePrompt: string;
}

export interface UploadImageJob extends BaseJobData{
  tempImageUrl: string;
}

// Job<데이터타입, 리턴타입, 이름타입>
export type PostJob = 
  | Job<AnalyzeTextJob, any, 'analyze-text'>
  | Job<SaveDataJob, any, 'save-data'>
  | Job<GenerateImageJob, any, 'generate-image'>
  | Job<UploadImageJob, any, 'upload-image'>;