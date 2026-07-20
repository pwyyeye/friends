import { Module } from '@nestjs/common';
import { AdminMatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
  controllers: [AdminMatchController],
  providers: [MatchService],
})
export class MatchModule {}