// src/pages/MesaPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiMesas, { Mesa } from "../services/apiMesas";
import apiSessions, { Session } from "../services/apiSessions";

// 🔁 Redirección automática opcional (usa la misma env que ya tenías)
const AUTO_REDIRECT =
  (process.env.REACT_APP_AUTO_REDIRECT_TO_MENU || "").toLowerCase() === "true";

const MesaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [sessState, setSessState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Evita doble navegación en StrictMode
  const redirected = useRef(false);

  useEffect(() => {
    let alive = true;

    const boot = async () => {
      if (!id) {
        if (alive) {
          setError("Mesa inválida: falta el parámetro 'id' en la URL.");
          setLoading(false);
        }
        return;
      }

      try {
        if (alive) {
          setLoading(true);
          setError("");
        }

        // 1) Cargar mesa
        const m = await apiMesas.getById(id);
        if (!alive) return;
        setMesa(m);

        // 2) Iniciar o reutilizar sesión
        const { session } = await apiSessions.startOrGetSession(id);
        if (!alive) return;
        setSessState(session);

        // 3) Guardar en localStorage
        localStorage.setItem("mesaId", id);
        localStorage.setItem("mesaNumero", String(m.numero));
        if (session?.sessionId) localStorage.setItem("sessionId", session.sessionId);

        // 4) 🚀 Redirigir automáticamente (solo si la env está activa) -> al Dashboard (/)
        if (AUTO_REDIRECT && !redirected.current) {
          redirected.current = true;
          navigate("/", { replace: true });
        }
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.message ||
          e?.response?.data?.msg ||
          e?.response?.data?.error ||
          "Error al iniciar la sesión de la mesa.";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };

    boot();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  // 🔁 Si el auto-redirect está activo, no mostramos la tarjeta;
  // solo un loader o el error (y luego navega al Dashboard /).
  if (AUTO_REDIRECT) {
    if (loading && !error) return <div style={{ padding: 24, color: "#c3a24a" }}>Preparando tu mesa…</div>;
    if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
    return null;
  }

  // 👉 Comportamiento actual intacto (sin redirección automática)
  if (loading) return <div style={{ padding: 24, color: "#c3a24a" }}>Cargando mesa…</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!mesa) return <div style={{ padding: 24 }}>Mesa no encontrada</div>;

  const started = sessState ? (sessState as any).startedAt ?? sessState.createdAt : null;

  return (
    <div style={{ padding: 24, color: "#c3a24a", fontFamily: "'Orbitron', sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Mesa {mesa.numero}</h1>
      <p style={{ opacity: 0.9, marginBottom: 16 }}>Estado: {mesa.estado}</p>

      {sessState ? (
        <div
          style={{
            background: "rgba(12,12,12,0.35)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(195,162,74,0.4)",
            borderRadius: 12,
            padding: 16,
            maxWidth: 560,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <strong>Sesión activa:</strong> {sessState.sessionId}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Inició: {started ? new Date(started).toLocaleString() : "—"}
          </div>

          {/* Ahora lleva al Dashboard */}
          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "rgba(12,12,12,0.55)",
              color: "#c3a24a",
              border: "1px solid rgba(195,162,74,0.5)",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Ir al dashboard
          </button>
        </div>
      ) : (
        <div>No hay sesión activa</div>
      )}
    </div>
  );
};

export default MesaPage;
