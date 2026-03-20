import { ApiProperty } from '@nestjs/swagger';

export class PostAnalysisEntitiy {
  @ApiProperty({
    description: '아이디',
  })
  id: number;

  @ApiProperty({
    description: 'post id',
  })
  postId: number;

  @ApiProperty({
    description: '이미지 생성 스타일',
  })
  style: string;

  @ApiProperty({
    description: 'supabase에 저장된 이미지 url',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'ai 글 요약',
  })
  summary: string;

  @ApiProperty({
    description: '레오나르도 ai 이미지 url',
  })
  tempImageUrl: string;

  @ApiProperty({
    description: 'ai 이미지 생성 prompt',
  })
  imagePrompt: string;

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;
}
