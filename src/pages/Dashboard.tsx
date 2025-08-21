// Dashboard.tsx (CLIENTE) — ajustado para usar la API nueva (default export + getActivas) e importar el tipo
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiPromocionesCliente from "../services/apiPromociones";
import type { Promocion } from "../services/apiPromociones";

const ROTATE_MS = 5000;
const FADE_MS = 400;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hoverMenu, setHoverMenu] = useState(false);
  const [hoverSong, setHoverSong] = useState(false);
  const [fade, setFade] = useState(false);

  // ---- Estado del banner dinámico ----
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFade(true); // animación de entrada
  }, []);

  // Cargar promociones activas desde el backend con fallbacks
useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      // 1) activas vigentes (activeNow)
      let items = await apiPromocionesCliente.getActivas(20, 1);

      // 2) si no hay vigentes, intenta las activas (sin fechas)
      if (mounted && (!items || items.length === 0)) {
        items = await apiPromocionesCliente.getAll({ activa: true, limit: 20, page: 1 });
      }

      // 3) si sigue vacío, trae todas
      if (mounted && (!items || items.length === 0)) {
        items = await apiPromocionesCliente.getAll({ limit: 20, page: 1 });
      }

      if (!mounted) return;

      setPromos(items || []);
      setIdx(0);
      requestAnimationFrame(() => setVisible(true)); // primer fade-in

      console.debug("[promos] cargadas:", items?.length ?? 0);
    } catch (e) {
      console.debug("[promos] error:", e);
      if (!mounted) return;
      setPromos([]);
    }
  })();

  return () => {
    mounted = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, []);


  // Rotación automática
  useEffect(() => {
    if (promos.length <= 1) return;
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setVisible(false); // fade-out
      setTimeout(() => {
        setIdx((i) => (i + 1) % promos.length);
        requestAnimationFrame(() => setVisible(true)); // fade-in siguiente
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [promos.length]);

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
    filter: "blur(1px) brightness(0.75) contrast(1)",
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

  // Banner con crossfade
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
    overflow: "hidden",
    transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.985)",
  };

  const bannerTextStyle: React.CSSProperties = {
    color: "#c3a24a",
    fontSize: "1.8em",
    textShadow: "0 2px 6px rgba(0,0,0,0.7)",
    zIndex: 1,
    margin: 0,
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.5) 100%)",
    zIndex: 0,
  };

  const currentPromo = useMemo(() => promos[idx], [promos, idx]);

  return (
    <>
      <div style={backgroundStyle}></div>

      <div style={containerStyle}>
        <h1 style={titleStyle}>Bienvenido</h1>
        <h2 style={subtitleStyle}>Elige una opción</h2>

        {/* Banner dinámico */}
        <div
          style={{
            ...bannerStyle,
            ...(currentPromo?.imagenUrl
              ? {
                  backgroundImage: `url('${currentPromo.imagenUrl}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {}),
          }}
        >
          <div style={overlayStyle} />
          <div>
            <h3 style={bannerTextStyle}>
              {currentPromo?.titulo || "¡Promoción de la Semana!"}
            </h3>
            {currentPromo?.descripcion ? (
              <p
                style={{
                  color: "rgba(255,255,255,0.92)",
                  marginTop: 6,
                  textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                }}
              >
                {currentPromo.descripcion}
              </p>
            ) : null}
          </div>

          {/* bullets si hay múltiples promos */}
          {promos.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 6,
                zIndex: 2,
              }}
            >
              {promos.map((_, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setVisible(false);
                    setTimeout(() => {
                      setIdx(i);
                      requestAnimationFrame(() => setVisible(true));
                    }, FADE_MS);
                  }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    cursor: "pointer",
                    border:
                      i === idx
                        ? "1px solid rgba(255,215,128,0.95)"
                        : "1px solid rgba(255,255,255,0.7)",
                    background:
                      i === idx
                        ? "rgba(255,215,128,0.95)"
                        : "rgba(0,0,0,0.25)",
                    boxShadow: "0 0 6px rgba(0,0,0,0.35)",
                  }}
                  title={`Ir a promoción ${i + 1}`}
                />
              ))}
            </div>
          )}
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
