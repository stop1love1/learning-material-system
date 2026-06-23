import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FoldersController, FilesController],
  providers: [FoldersService, FilesService],
  exports: [FoldersService, FilesService],
})
export class LibraryModule {}
