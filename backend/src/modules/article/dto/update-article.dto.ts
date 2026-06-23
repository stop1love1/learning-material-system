import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';

// All fields optional.
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
