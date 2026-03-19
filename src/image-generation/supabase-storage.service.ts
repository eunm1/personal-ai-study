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
}