import api from "./api";

export interface Mesa {
  _id: string;
  numero: number;
  qrCode?: string;
  estado?: "libre" | "ocupada";
}

const apiMesas = {
  getAll: async (): Promise<Mesa[]> => {
    const res = await api.get<any[]>("/api/mesas");
    return res.map((mesa) => ({
      _id: mesa._id,
      numero: mesa.numero,
      qrCode: mesa.qrCode || "",
      estado: mesa.estado || "libre",
    }));
  },

  getById: async (id: string): Promise<Mesa> => {
    const mesa = await api.get<any>(`/api/mesas/${id}`);
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