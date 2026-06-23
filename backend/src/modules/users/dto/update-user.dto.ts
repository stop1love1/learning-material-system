import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// All fields optional (incl. password → re-hashed when present).
export class UpdateUserDto extends PartialType(CreateUserDto) {}
