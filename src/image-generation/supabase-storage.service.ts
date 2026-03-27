import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // 👈 추가
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) { // 👈 주입
    // .env에 있는 URL과 KEY를 사용합니다.
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'), // 👈 안전하게 가져오기
      this.configService.get<string>('SUPABASE_KEY'),
    );
  }

  async uploadImage(postId: number, buffer: Buffer): Promise<string> {
    const fileName = `post_${postId}_${Date.now()}.png`;
    const bucketName = 'post-image'; // 아까 만든 버킷 이름

    // 1. 파일 업로드
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    // 2. 누구나 접근 가능한 Public URL 가져오기
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  async deleteImage(fileName: string) {
    const { data, error } = await this.supabase.storage
      .from('post-image') // 설정한 버킷 이름 🕵️‍♀️
      .remove([`${fileName}`]); // 배열 형태로 넘겨야 합니다!

    if (error) {
      console.error('스토리지 이미지 삭제 실패:', error);
      // 💡 이미지 삭제 실패가 전체 프로세스를 멈추게 할지 말지는 선택 사항입니다.
      // 보통 로그만 남기고 DB 삭제를 진행하기도 해요.
    }
    
    return data;
  }
}