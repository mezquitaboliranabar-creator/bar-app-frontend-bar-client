import api from "./api";

export interface Mesa {
  _id: string;
  numero: number;
  qrCode?: string;
  estado?: "libre" | "ocupada";
}

const apiMesas = {
  getAll: async (): Promise<Mesa[]> => {
    const mesas = await api.get<any[]>("/api/mesas"); // ✅ ya es array
    return mesas.map((m) => ({
      _id: m._id,
      numero: m.numero,
      qrCode: m.qrCode || "",
      estado: m.estado || "libre",
    }));
  },

  getById: async (id: string): Promise<Mesa> => {
    const mesa = await api.get<any>(`/api/mesas/${id}`); // es objeto
    return {
      _id: mesa._id,
      numero: mesa.numero,
      qrCode: mesa.qrCode || "",
      estado: mesa.estado || "libre",
    };
  },
};

export default apiMesas;
export {};
