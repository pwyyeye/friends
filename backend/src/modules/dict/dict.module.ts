import { Module } from '@nestjs/common';
import { DictController, AdminDictController } from './dict.controller';

@Module({
  controllers: [DictController, AdminDictController],
})
export class DictModule {}