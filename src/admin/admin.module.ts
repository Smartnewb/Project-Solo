import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunityController } from './community/community.controller';
import { CommunityService } from './community/community.service';
import { CommunityRepository } from './community/community.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityRepository],
  exports: [CommunityService],
})
export class AdminModule {}
