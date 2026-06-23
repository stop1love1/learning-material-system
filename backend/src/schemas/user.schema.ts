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

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
