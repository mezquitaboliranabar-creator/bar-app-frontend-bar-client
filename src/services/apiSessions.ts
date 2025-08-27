// src/services/apiSessions.ts
import api from "./api";

export interface Session {
  _id: string;
  mesa: string;
  sessionId: string;
  active: boolean;
  startedAt?: string;
  lastActivityAt?: string;                  // opcional, para idle
  closedAt: string | null;
  closedReason?: "manual" | "idle" | "absolute" | null; // opcional
  createdAt: string;
  updatedAt: string;
}

export interface PingResponse {
  ok: boolean;
  /** timestamp (ms) aproximado hasta el cual la sesión se mantiene viva si no hay actividad */
  until: number;
}

// Crea o reutiliza sesión
export const startOrGetSession = async (
  mesaId: string
): Promise<{ ok: boolean; session: Session }> => {
  const res = await api.post<{ ok: boolean; session: Session }>(
    "/api/sessions/start",
    { mesaId }
  );
  return res;
};

// Obtener sesión activa por mesa
export const getActiveByMesa = async (
  mesaId: string
): Promise<{ ok: boolean; session: Session }> => {
  const res = await api.get<{ ok: boolean; session: Session }>(
    `/api/sessions/by-mesa/${mesaId}`
  );
  return res;
};

// Cerrar sesión
export const closeSession = async (
  sessionId: string
): Promise<{ ok: boolean; session: Session }> => {
  const res = await api.post<{ ok: boolean; session: Session }>(
    `/api/sessions/${sessionId}/close`,
    {}
  );
  return res;
};

// Heartbeat/ping (mantiene viva la sesión y valida expiración)
export const ping = async (sessionId: string): Promise<PingResponse> => {
  // Ruta principal: /api/sessions/:sessionId/ping
  const res = await api.post<PingResponse>(`/api/sessions/${sessionId}/ping`, {});
  return res;
};

// Alias create → solo Session
export const create = async (mesaId: string): Promise<Session> => {
  const { session } = await startOrGetSession(mesaId);
  return session;
};

const apiSessions = { startOrGetSession, getActiveByMesa, closeSession, create, ping };
export default apiSessions;
