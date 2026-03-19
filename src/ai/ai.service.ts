import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
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

  async analyzePost(content: string) {
    try {
      // AI에게 줄 '지시사항(Prompt)'입니다. JSON으로 받기 위해 구체적으로 적어줍니다.
      const prompt = `
      다음 글을 읽고 요약과 카테고리를 추출해줘.
      
      [조건]
      1. summary: 본문을 2문장 내외로 요약.
      2. category: 본문에 어울리는 단어 하나 (예: 개발, 일상, 여행).
      3. imagePrompt: 이 글의 핵심 내용을 바탕으로 AI 이미지 생성을 위한 '상세한 영어 프롬프트' (Professional digital art style)
      4. 응답은 반드시 JSON 형식이어야 하며, 마크다운 코드 블록(\`\`\`json)을 절대 사용하지 마.
      5. 오직 순수 JSON 데이터만 출력해.

      본문: ${content}
      `;

      console.log(prompt)
      const result = await this.model.generateContent(prompt);
      console.log(result)

      const response = await result.response;
      const text = response.text();

      // AI가 준 텍스트(JSON 형태)를 실제 객체로 변환합니다.
      return JSON.parse(text);
    } catch (error) {
      console.error('AI 분석 중 에러 발생:', error);
      // 에러 발생 시 기본값 반환 (서버가 멈추지 않게)
      return { summary: content.substring(0, 50), category: '미분류' };
    }
  }
}