// src/services/apiMesas.ts
import api from "./api";

export interface Mesa {
  _id: string;
  numero: number;
  qrCode?: string;
  estado?: "libre" | "ocupada";
}

// Helpers para desempaquetar respuestas (Axios o fetch)
const unwrap = <T = any>(r: any): T => (r && "data" in r ? r.data : r);

const normalizeMesa = (m: any): Mesa => ({
  _id: String(m._id),
  numero: Number(m.numero),
  qrCode: m.qrCode ?? "",
  estado: m.estado === "ocupada" ? "ocupada" : "libre",
});

const apiMesas = {
  getAll: async (): Promise<Mesa[]> => {
    const raw = unwrap(await api.get("/api/mesas"));
    // Soporta: [ ... ]  |  { mesas: [...] }  |  { data: [...] }
    const list =
      Array.isArray(raw) ? raw : Array.isArray(raw?.mesas) ? raw.mesas : Array.isArray(raw?.data) ? raw.data : [];
    return list.map(normalizeMesa);
  },

  getById: async (id: string): Promise<Mesa> => {
    if (!id) throw new Error("Falta id de mesa");
    const raw = unwrap(await api.get(`/api/mesas/${id}`));
    // Soporta: { ...mesa }  |  { mesa: {...} }  |  { data: {...} }
    const obj = raw?.mesa ?? raw?.data ?? raw;
    if (!obj?._id) throw new Error("Mesa no encontrada");
    return normalizeMesa(obj);
  },
};

export default apiMesas;
export {};
