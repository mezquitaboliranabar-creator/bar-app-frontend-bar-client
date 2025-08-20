// src/services/apiSessions.ts
import api from "./api";

export interface Session {
  _id: string;
  mesa: string;
  sessionId: string;
  active: boolean;
  startedAt?: string;          // opcional por si no viene
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Crea o reutiliza la sesión activa de una mesa (devuelve { ok, session })
export const startOrGetSession = (mesaId: string) =>
  api.post<{ ok: boolean; session: Session }>("/api/sessions/start", { mesaId });

// Obtener la sesión activa por mesa
export const getActiveByMesa = (mesaId: string) =>
  api.get<{ ok: boolean; session: Session }>(`/api/sessions/by-mesa/${mesaId}`);

// Cerrar sesión por sessionId
export const closeSession = (sessionId: string) =>
  api.post<{ ok: boolean; session: Session }>(`/api/sessions/${sessionId}/close`, {});

// (opcional) alias create -> devuelve directamente la Session para quien lo use así
export const create = async (mesaId: string): Promise<Session> => {
  const { session } = await startOrGetSession(mesaId);
  return session;
};

// 👇 Default export DEBE incluir todos los métodos
const apiSessions = { startOrGetSession, getActiveByMesa, closeSession, create };
export default apiSessions;
