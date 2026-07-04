import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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

export class MiscSettingsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  allowGoogleLogin?: boolean;
}

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

export class PageContentDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;
}

export class PagesSettingsDto {
  @ApiPropertyOptional({ type: PageContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageContentDto)
  about?: PageContentDto;

  @ApiPropertyOptional({ type: PageContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageContentDto)
  guide?: PageContentDto;

  @ApiPropertyOptional({ type: PageContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageContentDto)
  contact?: PageContentDto;

  @ApiPropertyOptional({ type: PageContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageContentDto)
  terms?: PageContentDto;
}

export class AcademicSettingsDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  scoreScale?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  passThreshold?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  rounding?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  allowResubmit?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  showScoreImmediately?: boolean;
}

export class SecuritySettingsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  twoFactor?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  passwordRotationDays?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  lockoutThreshold?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  allowSelfRegister?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  ssoEnabled?: boolean;
}

export class NotificationsSettingsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  emailOnSubmit?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  remindUngraded?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;
}

export class IntegrationSettingsDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  smtpFrom?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  storageProvider?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  googleClientId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  googleApiKey?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  aiGemUrl?: string;
}

export class DataSettingsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  backupFrequency?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  encryptBackups?: boolean;
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

  @ApiPropertyOptional({ type: PagesSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PagesSettingsDto)
  pages?: PagesSettingsDto;

  @ApiPropertyOptional({ type: AcademicSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcademicSettingsDto)
  academic?: AcademicSettingsDto;

  @ApiPropertyOptional({ type: SecuritySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security?: SecuritySettingsDto;

  @ApiPropertyOptional({ type: NotificationsSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationsSettingsDto)
  notifications?: NotificationsSettingsDto;

  @ApiPropertyOptional({ type: IntegrationSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegrationSettingsDto)
  integration?: IntegrationSettingsDto;

  @ApiPropertyOptional({ type: DataSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DataSettingsDto)
  data?: DataSettingsDto;
}
