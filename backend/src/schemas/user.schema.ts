import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole, UserStatus } from '../enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  @ApiProperty({ type: String })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  @ApiProperty({ type: String })
  email: string;

  /** Hashed password (bcrypt/argon). Never returned by default. */
  @Prop({ type: String, default: null, select: false })
  password: string | null;

  @Prop({ type: String, required: true, enum: Object.values(UserRole), default: UserRole.Student, index: true })
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Prop({ type: String, default: null, match: /^https?:\/\/.+/, trim: true })
  @ApiProperty({ type: String, nullable: true })
  avatar: string | null;

  @Prop({ type: String, enum: Object.values(UserStatus), default: UserStatus.Active, index: true })
  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @Prop({ type: Date, default: null })
  @ApiProperty({ type: Date, nullable: true })
  lastActiveAt: Date | null;

  /** Whether the email address has been verified. Appears in /auth/me responses. */
  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean })
  emailVerified: boolean;

  /** Auth provider: 'local' (password) or 'google'. */
  @Prop({ type: String, default: 'local' })
  @ApiProperty({ type: String })
  provider: string;

  /** SHA-256 hash of the email-verification token (never the raw token). */
  @Prop({ type: String, default: null, select: false })
  verifyToken: string | null;

  @Prop({ type: Date, default: null, select: false })
  verifyExpires: Date | null;

  /** SHA-256 hash of the password reset token (never the raw token). */
  @Prop({ type: String, default: null, select: false })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null, select: false })
  resetPasswordExpires: Date | null;

  @Prop({ type: Date, default: null, select: false })
  passwordChangedAt: Date | null;

  @Prop({ type: Number, default: 0, select: false })
  failedLoginAttempts: number;

  @Prop({ type: Date, default: null, select: false })
  lockUntil: Date | null;

  /** SHA-256 hash of the 6-digit email-OTP 2FA code (never the raw code). */
  @Prop({ type: String, default: null, select: false })
  otpCode: string | null;

  @Prop({ type: Date, default: null, select: false })
  otpExpires: Date | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
