import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // AI가 추출한 이름으로 카테고리를 찾거나 생성하는 핵심 메서드
  async findOrCreateCategory(name: string) {
    
    // upsert : DB 유니크 제약 조건 에러가 나는 것을 방지
  return await this.prisma.category.upsert({
      where: { name: name }, // name이 Unique 설정되어 있어야 합니다.
      update: {},            // 이미 있으면 업데이트할 내용은 없으므로 빈 객체
      create: { name: name }, // 없으면 새로 생성
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      include: {
        _count: { select: { posts: true } }
      }
    });
  }

}
