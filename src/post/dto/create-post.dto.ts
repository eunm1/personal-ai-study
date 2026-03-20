import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  MinLength
} from 'class-validator';
import { IsCustomUrl, IsNonEmptyString } from 'src/validate-decorators';

export class CreatePostDto {
  @IsString()
  @IsNonEmptyString({ message: '제목은 필수입니다.' })
  title: string;

  @IsString()
  @IsNonEmptyString({ message: '본문은 필수입니다.' })
  content: string;

  @IsString()
  @IsNotEmpty({ message: '작성자는 필수입니다.' })
  author: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' })
  password: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional() // 스타일은 선택 사항!
  style?: string;
}
