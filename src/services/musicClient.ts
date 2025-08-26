import api from "./api";

export const musicClient = {
  // Buscar canciones en Spotify (vía tu backend)
  search: (q: string, market = "CO") =>
    api.get(`/api/music/search?q=${encodeURIComponent(q)}&market=${market}`),

  // Crear solicitud de canción
  createRequest: (payload: {
    sessionId: string;
    mesaId?: string;
    trackUri?: string;
    trackId?: string;
    trackUrl?: string;
    title: string;
    artist: string;
    imageUrl?: string;
  }) => api.post("/api/music/requests", payload),

  // Cola activa (para calcular posición): queued + approved + playing
  activeRequests: () =>
    api.get(`/api/music/requests?status=queued,approved,playing&sort=createdAt:asc&limit=100`),

  // Mis solicitudes activas (por sesión)
  myActiveRequests: (sessionId: string) =>
    api.get(`/api/music/requests?status=queued,approved,playing&sessionId=${encodeURIComponent(sessionId)}&sort=createdAt:asc&limit=100`),
};
