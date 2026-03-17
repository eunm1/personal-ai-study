import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryEntity } from './entity/category.entity';

@ApiTags('category (카테고리 관련 API)')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /*
   * GET
   */
  @Get('')
  @ApiExcludeEndpoint()
  findAllReviews() {
    return this.categoryService.findAll();
  }

}
