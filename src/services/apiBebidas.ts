import api from "./api";

export interface Bebida {
  _id: string;
  nombre: string;
  precio: number;
  categoria: {
    _id: string;
    nombre: string;
  };
}

const apiBebidas = {
  getAll: async (): Promise<Bebida[]> => {
    const res = await api.get<any[]>("/api/bebidas");
    return res.map((b) => ({
      _id: b._id,
      nombre: b.nombre,
      precio: b.precio,
      categoria: { _id: b.categoria._id, nombre: b.categoria.nombre },
    }));
  },
};

export default apiBebidas;
