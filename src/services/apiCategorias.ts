import api from "./api";

export interface Categoria {
  _id: string;
  nombre: string;
  imagen: string; // obligatorio para TS
}

const apiCategorias = {
  getAll: async (): Promise<Categoria[]> => {
    const res = await api.get<any[]>("/api/categorias");
    return res.map((cat) => ({
      _id: cat._id,
      nombre: cat.nombre,
      imagen: cat.imagen || "",
    }));
  },
};

export default apiCategorias;
export{}