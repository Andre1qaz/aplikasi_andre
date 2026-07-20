import { Module } from '@nestjs/common';
import { PrivateFilesService } from './private-files.service';
import { PrivateFilesController } from './private-files.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [PrivateFilesController],
  providers: [PrivateFilesService],
  exports: [PrivateFilesService],
})
export class PrivateFilesModule {}
