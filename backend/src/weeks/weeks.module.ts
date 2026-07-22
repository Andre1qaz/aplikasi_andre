import { Module } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { WeeksController } from './weeks.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WeeksController],
  providers: [WeeksService, PrismaService],
  exports: [WeeksService],
})
export class WeeksModule {}
