import type { ServerToClientEvents } from '@concierge/contracts';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { appointmentKeys, applyAppointment } from '../appointments/cache';
import { chatKeys, setReplying, upsertMessage, upsertSession } from '../chat/cache';

export function useRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket: Socket<ServerToClientEvents> = io({ withCredentials: true });

    const refetchIfInFlight = (...queryKeys: QueryKey[]) => {
      for (const queryKey of queryKeys) {
        if (queryClient.isFetching({ queryKey, exact: true }) > 0) {
          void queryClient.invalidateQueries({ queryKey, exact: true });
        }
      }
    };

    socket.on('message:upserted', (message) => {
      upsertMessage(queryClient, message);
      refetchIfInFlight(chatKeys.session(message.sessionId));
    });
    socket.on('session:updated', (session) => {
      upsertSession(queryClient, session);
      refetchIfInFlight(chatKeys.sessions, chatKeys.session(session.id));
    });
    socket.on('assistant:status', ({ sessionId, replying }) => {
      setReplying(queryClient, sessionId, replying);
      refetchIfInFlight(chatKeys.session(sessionId));
    });
    socket.on('appointment:upserted', (appointment) => {
      applyAppointment(queryClient, appointment);
      refetchIfInFlight(appointmentKeys.list('upcoming'), appointmentKeys.list('history'));
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.allAvailability });
    });
    socket.io.on('reconnect', () => void queryClient.invalidateQueries());

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
