import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

/** Thông tin tổ chức. */
export class OrgSettingsDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  timezone?: string;
}

/** Tùy biến giao diện. */
export class AppearanceSettingsDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  accent?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  headingFont?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  dark?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  density?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  railWide?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  assignFlow?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  rubricStyle?: string;
}

/** Tùy chọn khác. */
export class MiscSettingsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  allowGoogleLogin?: boolean;
}

/** Nội dung trang chủ công khai (admin tự chỉnh). */
export class HomepageSettingsDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  ctaLabel?: string;
}

/** Thông tin SEO trang công khai. */
export class SeoSettingsDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  ogImage?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ type: OrgSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrgSettingsDto)
  org?: OrgSettingsDto;

  @ApiPropertyOptional({ type: AppearanceSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppearanceSettingsDto)
  appearance?: AppearanceSettingsDto;

  @ApiPropertyOptional({ type: MiscSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MiscSettingsDto)
  misc?: MiscSettingsDto;

  @ApiPropertyOptional({ type: HomepageSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomepageSettingsDto)
  homepage?: HomepageSettingsDto;

  @ApiPropertyOptional({ type: SeoSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seo?: SeoSettingsDto;
}
