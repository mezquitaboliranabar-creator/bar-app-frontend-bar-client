import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiSessions from "../services/apiSessions";
import apiMesas from "../services/apiMesas";

export default function MesaGate() {
  const { id: mesaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Creando sesión...");

  useEffect(() => {
    const run = async () => {
      try {
        if (!mesaId) throw new Error("Mesa inválida");

        // Validar mesa
        await apiMesas.getById(mesaId);

        // Crear sesión
        const session = await apiSessions.create(mesaId);

        localStorage.setItem("bar_session_id", session.sessionId);
        localStorage.setItem("bar_mesa_id", mesaId);

        setStatus("ok");
        navigate("/menu", { replace: true });
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "No se pudo crear la sesión");
      }
    };
    run();
  }, [mesaId, navigate]);

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      {status === "loading" && <p>{message}</p>}
      {status === "error" && (
        <div>
          <p style={{ color: "red" }}>Error: {message}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      )}
    </div>
  );
}