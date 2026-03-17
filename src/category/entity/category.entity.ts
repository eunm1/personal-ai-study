import { ApiProperty } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({
    description: '아이디',
  })
  id: number;

  @ApiProperty({
    description: '카테고리 명',
  })
  name: string;

}
