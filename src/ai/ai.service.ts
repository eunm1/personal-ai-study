import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiAnalysisResult } from 'src/types/job-types';
import { POST_DEFAULT_STYLE } from 'src/types/post-types';

@Injectable()
export class AiService {
  private readonly prisma: PrismaService;
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    // 1. .env에 저장한 API 키를 불러옵니다.
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY가 설정되지 않았습니다.');
    }

    // 2. Gemini SDK 초기화
    this.genAI = new GoogleGenerativeAI(apiKey);
    // 3. 성능 좋고 가성비(무료)인 1.5 Flash 모델을 사용합니다.
    this.model = this.genAI.getGenerativeModel(
      { model: 'models/gemini-3-flash-preview' },
      { apiVersion: 'v1beta' }
    );
  }

  async analyzePost(content: string, style: string = POST_DEFAULT_STYLE): Promise<AiAnalysisResult> {
    try {
      // AI에게 줄 '지시사항(Prompt)'입니다. JSON으로 받기 위해 구체적으로 적어줍니다.
      const prompt = `
      다음 글을 읽고 요약과 카테고리를 추출해줘.
      
      [조건]
      1. 출력은 반드시 유효한 JSON 객체 하나여야 합니다.
      2. 필드 설명:
        - summary: 본문의 핵심 내용을 한국어 2문장 내외로 요약. (중복 문장 금지)
        - category: 본문과 가장 어울리는 한국어 단어 하나 (예: 요리, 개발, 일상, 여행).
        - imagePrompt: 이 글의 핵심 내용을 바탕으로 '${style}' 스타일을 반영한 AI 이미지 생성 영어 프롬프트.
      3. 중복된 문장이나 반복되는 구문을 절대 생성하지 마십시오.
      4. 마크다운(\`\`\`json) 없이 순수 JSON 텍스트만 출력하십시오.

      [출력 형식 예시]
      {
        "summary": "요약 내용",
        "category": "카테고리",
        "imagePrompt": "Detailed English prompt..."
      }

      본문: ${content}
      `;

      console.log(prompt)
      const result = await this.model.generateContent(prompt);
      
      // AI가 준 텍스트(JSON 형태)를 실제 객체로 변환합니다.
      const data = JSON.parse(result.response.text());
      console.log(data)

      return data;

    } catch (error) {
      console.error('AI 분석 중 에러 발생:', error);
      // 에러 발생 시 기본값 반환 (서버가 멈추지 않게)
      return { summary: content.substring(0, 50), category: '미분류'};
    }
  }
}