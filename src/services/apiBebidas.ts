import api from "./api";

export interface CategoriaBebida {
  _id: string;
  nombre: string;
}

export interface Bebida {
  _id: string;
  nombre: string;
  precio: number;
  categoria: CategoriaBebida; // ahora es un objeto
}

const apiBebidas = {
  getAll: async (): Promise<Bebida[]> => {
    const res = await api.get<any[]>("/api/bebidas");
    return res.map((b) => ({
      _id: b._id,
      nombre: b.nombre,
      precio: b.precio,
      categoria: {
        _id: b.categoria._id,
        nombre: b.categoria.nombre,
      },
    }));
  },
};

export default apiBebidas;
