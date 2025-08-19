import api from "./api";

export interface Session {
  sessionId: string;
  mesaId: string;
  createdAt?: string;
}

const apiSessions = {
  create: async (mesaId: string): Promise<Session> => {
    const session = await api.post<any>("/api/sessions", { mesaId });
    return {
      sessionId: session.sessionId,
      mesaId: session.mesaId,
      createdAt: session.createdAt || "",
    };
  },
};

export default apiSessions;