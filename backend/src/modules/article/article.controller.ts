import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách bài viết đã xuất bản (phân trang, lọc category/keyword)' })
  list(@Query() dto: ListArticlesDto) {
    return this.articleService.list(dto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết bài viết (tăng lượt xem)' })
  findOne(@Param('id') id: string) {
    return this.articleService.findById(id);
  }

  @Post()
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Tạo bài viết' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateArticleDto) {
    return this.articleService.create(userId, dto);
  }

  @Patch(':id')
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.articleService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Xóa bài viết' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.articleService.remove(id, userId, role);
  }
}
