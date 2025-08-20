// src/pages/MesaPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiMesas, { Mesa } from "../services/apiMesas";
import apiSessions, { Session } from "../services/apiSessions";


const MesaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const boot = async () => {
      if (!id) {
        setError("Mesa inválida");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");

        // 1) Cargar mesa
        const m = await apiMesas.getById(id);
        setMesa(m);

        // 2) Iniciar o reutilizar sesión (devuelve { ok, session })
        const { session } = await apiSessions.startOrGetSession(id);
        setSession(session);

        // 3) Guardar IDs
        localStorage.setItem("mesaId", id);
        localStorage.setItem("sessionId", session.sessionId);
      } catch (e: any) {
        setError(e?.message || "Error al iniciar la sesión de la mesa");
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [id]);

  if (loading) return <div style={{ padding: 24, color: "#c3a24a" }}>Cargando mesa…</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!mesa) return <div style={{ padding: 24 }}>Mesa no encontrada</div>;

  const started = session ? (session as any).startedAt ?? session.createdAt : null;

  return (
    <div style={{ padding: 24, color: "#c3a24a", fontFamily: "'Orbitron', sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Mesa {mesa.numero}</h1>
      <p style={{ opacity: 0.9, marginBottom: 16 }}>Estado: {mesa.estado}</p>

      {session ? (
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
            <strong>Sesión activa:</strong> {session.sessionId}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Inició: {started ? new Date(started).toLocaleString() : "—"}
          </div>
        </div>
      ) : (
        <div>No hay sesión activa</div>
      )}
    </div>
  );
};

export default MesaPage;
