import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { prismaExclude } from 'src/util/prisma-exclude';
import { removeWhitespace } from 'src/util/remove-whitepsace';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AiService } from 'src/ai/ai.service'; // 추가
import { CategoryService } from 'src/category/category.service'; // 추가
import { POST_SELECT_FIELDS, POST_DEFAULT_STYLE } from 'src/types/post-types';
import { InjectQueue } from '@nestjs/bullmq'; //
import { Queue } from 'bullmq';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private categoryService: CategoryService,
    @InjectQueue('post-tasks') private readonly postQueue: Queue, // 큐 주입
  ) {}

  async createPost(createPostDto: CreatePostDto) {
    console.log('컨트롤러 진입 성공:', createPostDto);
    const searchIndex = removeWhitespace([createPostDto.title]);
    const { title, content, author, password, style } = createPostDto;

    // 1. 일단 게시글을 DB에 저장 (imageUrl은 아직 없음)
    const post = await this.prisma.post.create({
        data: {
        title,
        content,
        author,
        password, // 나중에 bcrypt로 암호화할 부분!
        searchIndex,
        analysis: {
          create: {
            style: style || POST_DEFAULT_STYLE, // 스타일이 없으면 기본값 적용
            status: 'ANALYZING',
          },
        },
      },
      select: POST_SELECT_FIELDS, //post-type.ts
    });

    // 🚀 [비동기 핵심] 2. 이제 분석 큐(Queue)에 요약 ai 작업을 던집니다.
    await this.postQueue.add('analyze-text', {
      postId: post.id,
      style: post.analysis?.style,
      content: post.content, 
    });

    return post;
  }

  async findAllPosts() {

    // posts.map 가공 예시
    // const posts = await this.prisma.post.findMany({ include: { analysis: true } });

    // return posts.map(post => ({
    //   ...post,
    //   summary: post.analysis?.summary,
    //   imageUrl: post.analysis?.imageUrl,
    //   status: post.analysis?.status,
    // }));

    return await this.prisma.post.findMany({
      select: POST_SELECT_FIELDS, //post-type.ts
      orderBy: { createdAt: 'desc' } // 최신순 정렬 추가
    });
  }

  async searchPosts(q?: string) {
    const searchText = q.replace(/\s+/g, '');
    console.log(searchText);
    return await this.prisma.post.findMany({
      select: POST_SELECT_FIELDS,
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
      select: POST_SELECT_FIELDS,
      orderBy: { createdAt: 'desc' } // 최신순 정렬 추가
    });
  }

  async findOnePost(id: number) {
    const post = await this.prisma.post.findUnique({
      select: POST_SELECT_FIELDS,
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
    const { reAnalyze, ...updateData } = dto;

    //Todo 비밀번호 검증 (예정) 포스트와 비밀번호가 일치하는지 확인
    // 1. [검증] 기존 데이터 조회 (비밀번호 확인 및 기존 데이터 참조용)
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      include: { analysis: true }
    });
    if (!existingPost) throw new NotFoundException('포스트가 없어요!');

    // 2. [카테고리] 이름이 들어왔다면 처리
    let categoryId: number = existingPost.categoryId;
    if (updateData.category) {
      const category = await this.categoryService.findOrCreateCategory(updateData.category);
      categoryId = category.id;
    }

    if (reAnalyze === true) {
      await this.postQueue.add('analyze-text', {
        postId: id,
        content: updateData.content,
        style: updateData.style || existingPost.analysis?.style || POST_DEFAULT_STYLE, // 기존 스타일 유지
      });
    }

    const searchIndex = removeWhitespace([dto.title ?? existingPost.title]);

    return await this.prisma.post.update({
      data: {
        title: updateData.title, 
        content: updateData.content, 
        categoryId : categoryId,
        searchIndex : searchIndex,
        analysis : {
          update: {
            //** Prisma에서 update를 할 때 값이 **undefined**이면, **"이 필드는 수정하지 말고 기존 값을 그대로 적용
            //** 반면 **null**이 들어가면 DB의 해당 컬럼을 진짜 null로 밀어버림
            status: reAnalyze ? 'ANALYZING' : undefined,
            summary : updateData.summary,
            imageUrl : updateData.imageUrl
          }
        }
      },
      where: { id },
      select: POST_SELECT_FIELDS, // 아까 만든 공통 select
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
