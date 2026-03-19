import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { prismaExclude } from 'src/util/prisma-exclude';
import { removeWhitespace } from 'src/util/remove-whitepsace';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AiService } from 'src/ai/ai.service'; // 추가
import { CategoryService } from 'src/category/category.service'; // 추가
import { InjectQueue } from '@nestjs/bullmq'; //
import { Queue } from 'bullmq';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService, // AI 서비스 주입
    private categoryService: CategoryService, // 카테고리 서비스 주입
    @InjectQueue('post-tasks') private readonly postQueue: Queue, // 큐 주입
  ) {}

  async createPost(createPostDto: CreatePostDto) {
    console.log('컨트롤러 진입 성공:', createPostDto);
    const searchIndex = removeWhitespace([createPostDto.title]);

    // 1. AI에게 본문 전달 -> 카테고리 및 요약 추출 (AiService 호출)
    const { summary, category: categoryName, imagePrompt } = await this.aiService.analyzePost(createPostDto.content);

    // 2. 분석된 카테고리명으로 DB에서 찾거나 생성함
    const category = await this.categoryService.findOrCreateCategory(categoryName);

    // 3. 일단 게시글을 DB에 저장 (imageUrl은 아직 없음)
    const post = await this.prisma.post.create({
      data: { 
        ...createPostDto,
        searchIndex,
        summary: summary, // AI가 만든 요약
        categoryId: category.id, // 찾거나 생성된 카테고리 ID
      },
      // 응답 시 카테고리 이름도 포함해서 보여주기
      include: {
        category: {
          select: { name: true }
        }
      }
      
    });

    // 🚀 [비동기 핵심] 3. 이미지 생성 작업을 큐에 던집니다.
    // 유저는 여기서 기다리지 않고 바로 응답을 받게 됩니다!
    await this.postQueue.add('generate-image', {
      attempts: 3, // 3번까지 재시도
      postId: post.id,
      imagePrompt: imagePrompt, // 분석 단계에서 만든 영문 프롬프트
      backoff: {
        type: 'exponential',
        delay: 10000, // 에러 나면 10초 뒤에 다시 시도 (점점 늘어남)
      },
    });

    return post;
  }

  async findAllPosts() {
    return await this.prisma.post.findMany({
      select: {
        ...prismaExclude('Post', ['searchIndex']),
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' } // 최신순 정렬 추가
    });
  }

  async searchPosts(q?: string) {
    const searchText = q.replace(/\s+/g, '');
    console.log(searchText);
    return await this.prisma.post.findMany({
      select: {
        ...prismaExclude('Post', ['searchIndex']),
        category: {
          select: { name: true }
        }
      },
      where: {
        OR: [
          {
            searchIndex: { contains: searchText, mode: 'insensitive' },
          },
        ],
      },
    });
  }

  async findRandomPosts() {
    const totalPosts = await this.prisma.post.count();
    const skip = Math.floor(Math.random() * (totalPosts - 3));

    return await this.prisma.post.findMany({
      take: 3,
      skip: Math.max(0, skip),
      select: {
        ...prismaExclude('Post', ['searchIndex']),
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' } // 최신순 정렬 추가
    });
  }

  async findOnePost(id: number) {
    const post = await this.prisma.post.findUnique({
      select: {
        ...prismaExclude('Post', ['searchIndex']),
        category: {
          select: { name: true }
        }
      },
      where: {
        id: id,
      },
    });
    if (!post) {
      throw new NotFoundException(`${id}번 포스트는 존재하지 않습니다`);
    }
    return post;
  }

  async updatePost(id: number, dto: UpdatePostDto) {
    const beforeUpdateData = await this.prisma.post
      .findUnique({
        select: prismaExclude('Post', ['searchIndex']),
        where: {
          id: id,
        },
      })
      .catch((err) => console.log(err));

    if (!beforeUpdateData) {
      throw new NotFoundException(`${id}번 포스트는 존재하지 않습니다`);
    }

    const searchIndex = removeWhitespace([dto.title ?? beforeUpdateData.title]);

    return await this.prisma.post.update({
      select: prismaExclude('Post', ['searchIndex']),
      where: {
        id: id,
      },
      data: { ...dto, searchIndex },
    });
  }

  async removePost(id: number) {
    await this.prisma.post.delete({
      where: {
        id: id,
      },
    });
  }
}
