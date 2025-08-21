// apiPromociones.ts (CLIENTE) — alineado con tu controlador y el estilo de apiMesas
import api from "./api";

// -------- Tipos --------
export interface Promocion {
  _id: string;
  titulo: string;
  descripcion?: string;
  imagenUrl: string;
  activa: boolean;
  inicia?: string | null;   // ISO
  termina?: string | null;  // ISO
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ListarPromosParams {
  activeNow?: boolean; // el controlador lo soporta
  activa?: boolean;    // el controlador lo soporta
  limit?: number;      // default 50 en backend
  page?: number;       // default 1 en backend
}

// helper de QS (mismo patrón que usarías en otras APIs)
const buildQS = (params?: Partial<ListarPromosParams>): string => {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.append(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

const apiPromocionesCliente = {
  /**
   * Trae promociones desde /api/promociones (el backend devuelve { ok, total, page, limit, items }).
   * Devuelve SIEMPRE un array de Promocion (mismo estilo que apiMesas.getAll).
   */
  getAll: async (params?: Partial<ListarPromosParams>): Promise<Promocion[]> => {
    const qs = buildQS(params);
    const resp = await api.get<any>(`/api/promociones${qs}`); // resp = { ok, total, items, ... }
    const items: any[] = Array.isArray(resp?.items) ? resp.items : [];
    // Normalizamos y ordenamos por 'orden' ascendente (fallback 0)
    return items
      .map((p) => ({
        _id: p._id,
        titulo: p.titulo,
        descripcion: p.descripcion || "",
        imagenUrl: p.imagenUrl,
        activa: Boolean(p.activa),
        inicia: p.inicia || null,
        termina: p.termina || null,
        orden: typeof p.orden === "number" ? p.orden : 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  },

  /**
   * Atajo pensado para el banner del cliente:
   * trae SOLO las promociones vigentes (activeNow=true) ya ordenadas.
   */
  getActivas: async (limit = 20, page = 1): Promise<Promocion[]> => {
    return apiPromocionesCliente.getAll({ activeNow: true, limit, page });
  },

  /**
   * Obtener una promoción por id (GET /api/promociones/:id).
   * El backend devuelve un objeto directo (no envuelve en {ok}).
   */
  getById: async (id: string): Promise<Promocion> => {
    const p = await api.get<any>(`/api/promociones/${id}`);
    return {
      _id: p._id,
      titulo: p.titulo,
      descripcion: p.descripcion || "",
      imagenUrl: p.imagenUrl,
      activa: Boolean(p.activa),
      inicia: p.inicia || null,
      termina: p.termina || null,
      orden: typeof p.orden === "number" ? p.orden : 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  },
};

export default apiPromocionesCliente;
export { apiPromocionesCliente };
export type { ListarPromosParams };
