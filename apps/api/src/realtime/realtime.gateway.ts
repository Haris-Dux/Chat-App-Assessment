import type { ServerToClientEvents } from '@concierge/contracts';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parseCookie } from 'cookie';
import type { Server, Socket } from 'socket.io';
import {
  APPOINTMENT_SAVED,
  type AppointmentSavedEvent,
} from '../appointments/appointment.events.js';
import type { AuthUser } from '../auth/auth-user.js';
import { SESSION_COOKIE, SessionService } from '../auth/session.service.js';
import {
  ChatEvents,
  type AssistantStatusChangedEvent,
  type MessageUpsertedEvent,
  type SessionUpdatedEvent,
} from '../chat/chat.events.js';

interface SocketData {
  user: AuthUser;
}

type RealtimeServer = Server<Record<string, never>, ServerToClientEvents, never, SocketData>;
type RealtimeSocket = Socket<Record<string, never>, ServerToClientEvents, never, SocketData>;

@WebSocketGateway()
export class RealtimeGateway
  implements OnGatewayInit<RealtimeServer>, OnGatewayConnection<RealtimeSocket>
{
  @WebSocketServer()
  private readonly server: RealtimeServer;

  constructor(private readonly sessions: SessionService) {}

  afterInit(server: RealtimeServer): void {
    server.use((socket, next) => {
      const token = parseCookie(socket.handshake.headers.cookie ?? '')[SESSION_COOKIE];

      this.sessions.resolve(token).then((user) => {
        if (!user) {
          next(new Error('Unauthorized'));
          return;
        }
        socket.data.user = user;
        next();
      }, next);
    });
  }

  async handleConnection(socket: RealtimeSocket): Promise<void> {
    await socket.join(userRoom(socket.data.user.userId));
  }

  @OnEvent(ChatEvents.MessageUpserted)
  pushMessage({ userId, message }: MessageUpsertedEvent): void {
    this.toUser(userId).emit('message:upserted', message);
  }

  @OnEvent(ChatEvents.SessionUpdated)
  pushSession({ userId, session }: SessionUpdatedEvent): void {
    this.toUser(userId).emit('session:updated', session);
  }

  @OnEvent(ChatEvents.AssistantStatusChanged)
  pushAssistantStatus({ userId, status }: AssistantStatusChangedEvent): void {
    this.toUser(userId).emit('assistant:status', status);
  }

  @OnEvent(APPOINTMENT_SAVED)
  pushAppointment({ userId, appointment }: AppointmentSavedEvent): void {
    this.toUser(userId).emit('appointment:upserted', appointment);
  }

  private toUser(userId: string) {
    return this.server.to(userRoom(userId));
  }
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}
