import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { BusinessesModule } from '../businesses/businesses.module.js';
import { AssistantService } from './assistant.service.js';
import { BookingFlow } from './booking-flow.js';
import { ChatController } from './chat.controller.js';
import { ChatRepository } from './chat.repository.js';
import { ChatService } from './chat.service.js';
import { ReplyQueue } from './reply-queue.js';

@Module({
  imports: [AiModule, AppointmentsModule, BusinessesModule],
  controllers: [ChatController],
  providers: [ChatRepository, ChatService, AssistantService, BookingFlow, ReplyQueue],
})
export class ChatModule {}
