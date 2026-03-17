import { ApiProperty } from '@nestjs/swagger';

export class PostEntitiy {
  @ApiProperty({
    description: '아이디',
  })
  id: number;

  @ApiProperty({
    description: '글 제목',
  })
  title: string;

  @ApiProperty({
    description: '글 내용',
  })
  content: string;

  @ApiProperty({
    description: 'ai 생성이미지 url',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'ai 글 요약',
  })
  summary: string;

  @ApiProperty({
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ai 분류 카테고리 id',
  })
  categoryId: number;
}
