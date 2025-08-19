import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiCategorias, { Categoria } from "../services/apiCategorias";
import apiBebidas, { Bebida } from "../services/apiBebidas";

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [bebidas, setBebidas] = useState<Bebida[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setFade(true); // animación de entrada

    const fetchCategorias = async () => {
      try {
        const cats = await apiCategorias.getAll();
        setCategorias(cats);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      }
    };
    fetchCategorias();

    const fetchBebidas = async () => {
      try {
        const bds = await apiBebidas.getAll();
        setBebidas(bds);
      } catch (err) {
        console.error("Error al cargar bebidas:", err);
      }
    };
    fetchBebidas();
  }, []);

  const toggleCategory = (id: string) =>
    setActiveCategory((prev) => (prev === id ? null : id));

  const handleNavigateBack = () => {
    setFade(false); // animación de salida
    setTimeout(() => navigate("/"), 300);
  };

  const containerStyle: React.CSSProperties = {
    opacity: fade ? 1 : 0,
    transform: fade ? "translateY(0px)" : "translateY(20px)",
    transition: "opacity 0.35s ease, transform 0.35s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px",
    fontFamily: "'Orbitron', sans-serif",
    position: "relative",
    minHeight: "100vh",
    color: "#FFD780",
  };

  const backgroundStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1597290282695-edc43d0e7129?q=80&w=1475&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(1px) brightness(0.75) contrast(1)",
    zIndex: -2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "1.4rem",
    fontWeight: 400,
    color: "rgba(255,255,255,0.9)",
    textShadow: "0 0 4px rgba(0,0,0,0.5)",
    marginBottom: "25px",
  };

  const backButtonStyle: React.CSSProperties = {
    position: "fixed",
    top: "20px",
    left: "20px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "2px solid #FFD780",
    background: "rgba(12,12,12,0.35)",
    color: "#FFD780",
    fontWeight: 700,
    cursor: "pointer",
    zIndex: 10,
  };

  const categoryWrapperStyle = (isActive: boolean, numBebidas: number, index: number): React.CSSProperties => ({
    position: "relative",
    width: "280px",
    height: isActive ? 110 + numBebidas * 32 : 110,
    marginBottom: "18px",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    opacity: fade ? 1 : 0,
    transform: fade ? "translateY(0px)" : "translateY(20px)",
    transition: `opacity 0.5s ease ${(index + 1) * 0.1}s, transform 0.5s ease ${(index + 1) * 0.1}s, height 0.4s ease`,
  });

  const categoryBackgroundStyle = (imagen: string, isActive: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${imagen})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(2.5px) brightness(0.75)",
    transition: "all 0.5s ease",
    transform: isActive ? "scale(1.05)" : "scale(1)",
    zIndex: 0,
  });

  const categoryContentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    padding: "12px",
    color: "#FFD780",
    textShadow: "0 0 6px rgba(0,0,0,0.8)",
    width: "100%",
  };

  const categoryTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: "1.4rem",
    marginBottom: "6px",
    color: "#FFD780",
    textAlign: "center",
  };

  const bebidasStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.95)",
    fontSize: "1rem",
    fontWeight: 600,
    textShadow: "0 0 3px rgba(0,0,0,0.6)",
    marginTop: "8px",
    paddingLeft: "0",
    listStyle: "none",
    lineHeight: "1.8",
  };

  return (
    <>
      <div style={backgroundStyle}></div>
      <button style={backButtonStyle} onClick={handleNavigateBack}>
        Volver
      </button>
      <div style={containerStyle}>
        <h1 style={{ fontSize: "2.6rem", marginBottom: "8px" }}>Menú</h1>
        <h2 style={subtitleStyle}>Selecciona una categoría</h2>

        {categorias.map((cat, index) => {
          const isActive = activeCategory === cat._id;
          const bebidasDeCategoria = bebidas.filter((b) => b.categoria._id === cat._id);

          return (
            <div
              key={cat._id}
              style={categoryWrapperStyle(isActive, bebidasDeCategoria.length, index)}
              onClick={() => toggleCategory(cat._id)}
            >
              <div style={categoryBackgroundStyle(cat.imagen, isActive)} />
              <div style={categoryContentStyle}>
                <span style={categoryTitleStyle}>{cat.nombre}</span>
                {isActive && (
                  <ul style={bebidasStyle}>
                    {bebidasDeCategoria.length > 0 ? (
                      bebidasDeCategoria.map((b) => (
                        <li key={b._id}>
                          {b.nombre} - ${b.precio.toFixed(2)}
                        </li>
                      ))
                    ) : (
                      <li>No hay bebidas en esta categoría</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Menu;
