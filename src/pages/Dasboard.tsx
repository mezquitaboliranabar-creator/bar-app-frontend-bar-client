import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hoverMenu, setHoverMenu] = useState(false);
  const [hoverSong, setHoverSong] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setFade(true); // animación de entrada
  }, []);

  const handleNavigate = (path: string) => {
    setFade(false); // animación de salida
    setTimeout(() => navigate(path), 300);
  };

  const buttonBase = {
    background: "rgba(12,12,12,0.35)",
    backdropFilter: "blur(2.5px)", 
    WebkitBackdropFilter: "blur(2.5px)",
    color: "#c3a24a",
    padding: "12px 24px",
    border: "1px solid rgba(195,162,74,0.4)",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease",
    margin: "10px 0",
    width: "80%",
    maxWidth: "300px",
    textAlign: "center" as const,
  };

  const hoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
    filter: "saturate(1.1)",
  };

  const containerStyle: React.CSSProperties = {
    opacity: fade ? 1 : 0,
    transform: fade ? "translateY(0px)" : "translateY(20px)",
    transition: "opacity 0.35s ease, transform 0.35s ease",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    textAlign: "center",
    padding: "40px 20px",
    color: "#c3a24a",
    fontFamily: "'Orbitron', sans-serif",
    position: "relative",
    backgroundColor: "transparent",
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
    filter: "blur(1px) brightness(0.75) contrast(1)", // coincide con Menu
    zIndex: -2,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "3.2em",
    fontWeight: "bold",
    color: "rgba(255, 215, 128, 0.85)",
    textShadow:
      "0 0 6px rgba(255,215,128,0.4), 0 0 12px rgba(255,215,128,0.3), 0 0 20px rgba(255,215,128,0.2)",
    marginBottom: "10px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "1.4em",
    fontWeight: 400,
    color: "rgba(255,255,255,0.9)",
    textShadow: "0 0 4px rgba(0,0,0,0.5)",
    marginBottom: "28px",
  };

  const bannerStyle: React.CSSProperties = {
    width: "90%",
    maxWidth: "600px",
    minHeight: "140px",
    borderRadius: "16px",
    background: "rgba(12,12,12,0.35)",
    backdropFilter: "blur(2.5px)",
    WebkitBackdropFilter: "blur(2.5px)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "30px",
    position: "relative",
    textAlign: "center" as const,
    padding: "15px 20px",
  };

  const bannerTextStyle: React.CSSProperties = {
    color: "#c3a24a",
    fontSize: "1.8em",
    textShadow: "0 2px 6px rgba(0,0,0,0.7)",
  };

  return (
    <>
      <div style={backgroundStyle}></div>

      <div style={containerStyle}>
        <h1 style={titleStyle}>Bienvenido</h1>
        <h2 style={subtitleStyle}>Elige una opción</h2>

        <div style={bannerStyle}>
          <span style={bannerTextStyle}>¡Promoción de la Semana!</span>
        </div>

        <button
          style={{ ...buttonBase, ...(hoverMenu ? hoverStyle : {}) }}
          onMouseEnter={() => setHoverMenu(true)}
          onMouseLeave={() => setHoverMenu(false)}
          onClick={() => handleNavigate("/menu")}
        >
          Explorar Menú
        </button>

        <button
          style={{ ...buttonBase, ...(hoverSong ? hoverStyle : {}) }}
          onMouseEnter={() => setHoverSong(true)}
          onMouseLeave={() => setHoverSong(false)}
          onClick={() => alert("Próximamente 🎶")}
        >
          Elige tu Canción
        </button>
      </div>
    </>
  );
};

export default Dashboard;
