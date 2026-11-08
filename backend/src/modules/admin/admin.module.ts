import { Module } from "@nestjs/common";
import {
  AdminUserController,
  AdminChildController,
} from "./admin-user.controller";
import { ProfileModule } from "@/modules/profile/profile.module";

@Module({
  imports: [ProfileModule],
  controllers: [AdminUserController, AdminChildController],
})
export class AdminModule {}
