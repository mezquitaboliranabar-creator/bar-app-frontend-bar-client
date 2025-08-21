import api from "./api";

export interface Session {
  _id: string;
  mesa: string;
  sessionId: string;
  active: boolean;
  startedAt?: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

// Alias create → solo Session
export const create = async (mesaId: string): Promise<Session> => {
  const { session } = await startOrGetSession(mesaId);
  return session;
};

const apiSessions = { startOrGetSession, getActiveByMesa, closeSession, create };
export default apiSessions;
