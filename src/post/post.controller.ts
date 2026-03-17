import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';

import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { PostEntitiy } from './entitiy/post.entitiy';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('post (post관련 API)')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /*
   * GET
   */
  @Get()
  @ApiOperation({
    summary: '모든 글 불러오기',
    description: '데이터베이스에 저장되어있는 모든 글을 불러옵니다.',
  })
  @ApiOkResponse({
    type: PostEntitiy,
    isArray: true,
  })
  findAll() {
    return this.postService.findAllPosts();
  }

  @Get('/search')
  @ApiOperation({
    summary: '글 검색하기',
    description: '글 제목을 기준으로 검색합니다',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    description: '글 제목 검색',
    required: true,
  })
  @ApiOkResponse({
    type: PostEntitiy,
    isArray: true,
  })
  findSearchResult(@Query('q') q?: string) {
    return this.postService.searchPosts(q);
  }

  @Get('random')
  @ApiOperation({
    summary: '랜덤 글 불러오기',
    description: '랜덤 3개의 글를 불러옵니다 (추천글에 사용하세요)',
  })
  @ApiOkResponse({
    type: PostEntitiy,
    isArray: true,
  })
  findRandom() {
    return this.postService.findRandomPosts();
  }

  @Get(':movieId')
  @ApiOperation({
    summary: '특정 글 불러오기',
    description: 'id를 기준으로 특정 글의 정보를 불러옵니다',
  })
  @ApiParam({
    name: 'movieId',
    description: '정보를 불러오려는 글의 아이디',
    type: Number,
  })
  @ApiOkResponse({
    type: PostEntitiy,
  })
  @ApiNotFoundResponse({
    description: '{id}번 글는 존재하지 않습니다',
  })
  findOne(@Param('movieId') movieId: number) {
    return this.postService.findOnePost(movieId);
  }

  /*
   * POST
   */
  @Post()
  @ApiOperation({
    summary: '새로운 글 생성하기',
    description: '새로운 글를 생성합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: '포스트 아이디',
        },
        title: {
          type: 'string',
          description: '포스트 제목',
        },
        content: {
          type: 'string',
          description: '포스트 내용',
        },
        imageUrl: {
          type: 'string',
          description: '포스트 이미지 url',
          nullable: true,
        },
        summary: {
          type: 'string',
          description: '포스트 내용 요약',
          nullable: true,
        },
        categoryId: {
          type: 'string',
          description: '제작사',
          nullable: true,
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: PostEntitiy,
  })
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.createPost(createPostDto);
  }

  /*
   * PATCH
   */
  @Patch(':movieId')
  @ApiOperation({
    summary: '글 정보 수정하기',
    description: '특정 글의 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'movieId',
    description: '정보를 수정하려는 글의 아이디',
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: '포스트 아이디',
        },
        title: {
          type: 'string',
          description: '포스트 제목',
        },
        content: {
          type: 'string',
          description: '포스트 내용',
        },
        imageUrl: {
          type: 'string',
          description: '포스트 이미지 url',
          nullable: true,
        },
        summary: {
          type: 'string',
          description: '포스트 내용 요약',
          nullable: true,
        },
        categoryId: {
          type: 'string',
          description: '제작사',
          nullable: true,
        },
      },
    },
  })
  @ApiOkResponse({
    type: PostEntitiy,
  })
  @ApiNotFoundResponse()
  update(
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(postId, updatePostDto);
  }

  /*
   * DELETE
   */
  @Delete(':postId')
  @ApiOperation({
    summary: '포스트 삭제하기',
    description:
      '특정 포스트를 삭제합니다.',
  })
  @ApiParam({
    name: 'postId',
    description: '삭제하려는 포스트의 아이디',
    type: Number,
  })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  delete(@Param('postId') postId: number) {
    return this.postService.removePost(postId);
  }
}
