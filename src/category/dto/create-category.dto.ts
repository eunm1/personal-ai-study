import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { IsNonEmptyString } from 'src/validate-decorators';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;
}
