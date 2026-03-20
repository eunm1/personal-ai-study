import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ImageGenerationService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://cloud.leonardo.ai/api/rest/v1';

  constructor(private configService: ConfigService) {
    // 1. .env에서 Leonardo API 키를 가져옵니다.
    this.apiKey = this.configService.get<string>('LEONARDO_API_KEY');
    if (!this.apiKey) {
      throw new InternalServerErrorException('LEONARDO_API_KEY가 설정되지 않았습니다.');
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      console.log("Leonardo prompt:", prompt);

      // 2. 이미지 생성 요청 (Generation ID 발급받기)
      const generateRes = await axios.post(
        `${this.baseUrl}/generations`,
        {
          prompt: prompt,
          modelId: "7b592283-e8a7-4c5a-9ba6-d18c31f258b9", 
          width: 512,
          height: 512,
          num_images: 1,
        },
        { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } }
      );

      const generationId = generateRes.data.sdGenerationJob.generationId;

      // 3. 이미지 완성될 때까지 대기 (Leonardo는 시간이 좀 걸려요)
      // 간단하게 5초씩 쉬면서 최대 3번 확인하는 로직입니다.
      let imageUrl = '';
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기

        const resultRes = await axios.get(`${this.baseUrl}/generations/${generationId}`, {
          headers: { Authorization: `Bearer ${this.apiKey}` }
        });

        const images = resultRes.data.generations_by_pk.generated_images;
        if (images && images.length > 0) {
          imageUrl = images[0].url;
          break;
        }
        console.log("이미지 생성 중... 다시 확인합니다.");
      }

      if (!imageUrl) throw new Error("이미지 생성 시간 초과");

      // 4. URL에서 이미지 다운로드하여 Buffer로 변환
      
      return imageUrl

    } catch (error) {
      console.error('Leonardo AI 이미지 생성 중 에러 발생:', error?.response?.data || error.message);
      throw error;
    }
  }
}