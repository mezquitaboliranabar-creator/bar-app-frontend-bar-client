// src/pages/ClienteSpotify.tsx
import React, { useEffect, useRef, useState } from "react";
import { musicClient } from "../services/musicClient";

// -------- Utils --------
function msToMinSec(ms?: number) {
  if (ms == null) return "--:--";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function useInterval(cb: () => void, ms: number | null) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  }, [cb]);
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

// -------- Tipos mínimos --------
type RequestDoc = {
  _id: string;
  trackUri: string;
  title: string;
  artist: string;
  imageUrl?: string;
  status: "queued" | "approved" | "playing" | "rejected" | "done";
  createdAt: string;
};

// Normaliza un item de búsqueda a un formato común
function parseTrackItem(raw: any) {
  const uri =
    raw?.uri ||
    raw?.data?.uri ||
    raw?.track?.uri ||
    (raw?.id ? `spotify:track:${raw.id}` : "");

  const name =
    raw?.name ||
    raw?.data?.name ||
    raw?.track?.name ||
    raw?.title ||
    "";

  const artistNames =
    (raw?.artists?.map((a: any) => a?.name).join(", ")) ||
    (raw?.data?.artists?.items?.map((a: any) => a?.profile?.name).join(", ")) ||
    (raw?.track?.artists?.map((a: any) => a?.name).join(", ")) ||
    raw?.artist ||
    "";

  const images =
    raw?.album?.images ||
    raw?.track?.album?.images ||
    raw?.images ||
    raw?.data?.albumOfTrack?.coverArt?.sources ||
    [];

  const imageUrl =
    images?.[0]?.url ||
    (typeof images?.[0]?.url === "string" ? images[0].url : undefined);

  const duration_ms =
    raw?.duration_ms ??
    raw?.track?.duration_ms ??
    raw?.data?.duration?.totalMilliseconds ??
    undefined;

  return { uri, name, artistNames, imageUrl, duration_ms };
}

// -------- Estilos --------
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px 16px 60px",
    color: "#c3a24a",
    fontFamily: "'Orbitron', sans-serif",
    position: "relative",
  },
  bg: {
    content: "''",
    position: "fixed",
    inset: 0,
    backgroundImage:
      "url('https://images.unsplash.com/photo-1597290282695-edc43d0e7129?q=80&w=1475&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(2px) brightness(0.6) contrast(0.95)",
    zIndex: -1,
  },
  overlay: {
    content: "''",
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.7) 100%)",
    zIndex: -1,
  },
  title: {
    textAlign: "center",
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "rgba(255, 215, 128, 0.9)",
    marginBottom: 6,
    textShadow:
      "0 0 6px rgba(255,215,128,0.4), 0 0 12px rgba(255,215,128,0.3), 0 0 20px rgba(255,215,128,0.2)",
  },
  subtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 18,
    fontSize: "0.95rem",
  },
  card: {
    maxWidth: 900,
    margin: "0 auto",
    background: "rgba(12,12,12,0.35)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(195,162,74,0.35)",
    borderRadius: 14,
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
    padding: 16,
  },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  input: {
    flex: "1 1 360px",
    minWidth: 260,
    padding: "12px 14px",
    background: "rgba(0,0,0,0.5)",
    color: "#e6d8a8",
    border: "1px solid rgba(195,162,74,0.35)",
    borderRadius: 10,
    outline: "none",
  },
  button: {
    background: "rgba(12,12,12,0.35)",
    color: "#c3a24a",
    padding: "10px 16px",
    border: "1px solid rgba(195,162,74,0.4)",
    borderRadius: 12,
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
  },
  small: { fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" },
  list: { marginTop: 12 },
  itemRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(195,162,74,0.25)",
    background: "rgba(0,0,0,0.35)",
    marginBottom: 10,
  },
  cover: {
    width: 52,
    height: 52,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid rgba(195,162,74,0.25)",
  },
  titleArtist: { fontWeight: 800 },
  sub: { opacity: 0.85 },
  statusCard: {
    maxWidth: 900,
    margin: "14px auto 0",
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(195,162,74,0.4)",
    background: "rgba(12,12,12,0.35)",
  },
  error: { marginTop: 10, color: "#ffb3b3" },
};

// -------- Página --------
const ClienteSpotify: React.FC<{
  sessionId?: string; // si no lo pasas, intenta leer de localStorage
  mesaId?: string; // idem
}> = ({ sessionId: sessionIdProp, mesaId: mesaIdProp }) => {
  // Identidad del cliente
  const [sessionId, setSessionId] = useState<string>("");
  const [mesaId, setMesaId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const s = sessionIdProp || localStorage.getItem("sessionId") || "";
    const m = mesaIdProp || localStorage.getItem("mesaId") || undefined;
    setSessionId(s);
    setMesaId(m);
  }, [sessionIdProp, mesaIdProp]);

  // Búsqueda
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Pedido hecho
  const [lastRequest, setLastRequest] = useState<RequestDoc | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [totalActive, setTotalActive] = useState<number>(0);

  // Buscar con debounce
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        setSearching(true);
        const r: any = await musicClient.search(q, "CO");

        // Acepta diferentes estructuras
        const rawItems =
          r?.items ||
          r?.tracks?.items ||
          r?.tracks ||
          r?.results ||
          r?.data?.tracks?.items ||
          [];

        setResults(Array.isArray(rawItems) ? rawItems : []);
      } catch (e: any) {
        setErr(e?.message || "No se pudo buscar");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  // Calcular posición global (cola de solicitudes activas)
  const calcPosition = async (reqId: string) => {
    try {
      const list: any = await musicClient.activeRequests();
      const items: RequestDoc[] = list?.items || [];
      const idx = items.findIndex((x) => x._id === reqId);
      setTotalActive(list?.total ?? items.length ?? 0);
      setPosition(idx >= 0 ? idx + 1 : null);
    } catch (e: any) {
      setErr(e?.message || "No se pudo calcular la posición");
    }
  };

  // Poll para refrescar posición si hay pedido en curso
  useInterval(() => {
    if (lastRequest?._id) calcPosition(lastRequest._id);
  }, lastRequest?._id ? 5000 : null);

  const pedirCancion = async (t: any) => {
    setErr(null);
    if (!sessionId) {
      setErr("No hay sesión activa. Pídele al staff que abra tu mesa.");
      return;
    }

    const p = parseTrackItem(t);

    try {
      const resp: any = await musicClient.createRequest({
        sessionId,
        mesaId,
        trackUri: p.uri,
        title: p.name || "—",
        artist: p.artistNames || "—",
        imageUrl: p.imageUrl,
      });
      const doc: RequestDoc | undefined = resp?.request;
      if (!doc) throw new Error("Respuesta inesperada del servidor");

      setLastRequest(doc);
      await calcPosition(doc._id);
      // Limpia la búsqueda
      setQ("");
      setResults([]);
    } catch (e: any) {
      // Intenta leer mensaje del backend si vino serializado
      try {
        const parsed = JSON.parse(e.message);
        setErr(parsed?.msg || e.message);
      } catch {
        setErr(e?.message || "No se pudo crear la solicitud");
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg}></div>
      <div style={styles.overlay}></div>

      <h1 style={styles.title}>Pide tu canción</h1>
      <div style={styles.subtitle}>
        Busca tu canción favorita, añádela a la cola del bar y mira tu posición.
      </div>

      {/* Buscador */}
      <div style={styles.card}>
        <div style={styles.row}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por canción o artista…"
            style={styles.input}
          />
        </div>

        <div style={{ ...styles.row, marginTop: 10 }}>
          <button style={styles.button} onClick={() => setQ("")}>
            Limpiar
          </button>
          <div style={styles.small}>
            {searching ? "Buscando…" : results.length ? `${results.length} resultados` : "—"}
          </div>
        </div>

        <div style={styles.list}>
          {results.slice(0, 12).map((t, i) => {
            const p = parseTrackItem(t);
            return (
              <div key={p.uri || i} style={styles.itemRow}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" style={styles.cover} />
                ) : (
                  <div
                    style={{
                      ...styles.cover,
                      display: "grid",
                      placeItems: "center",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    ♪
                  </div>
                )}
                <div>
                  <div style={styles.titleArtist}>{p.name || "—"}</div>
                  <div style={styles.sub}>{p.artistNames || "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={styles.small}>{msToMinSec(p.duration_ms)}</div>
                  <button style={styles.button} onClick={() => pedirCancion(t)}>
                    Pedir
                  </button>
                </div>
              </div>
            );
          })}

          {!searching && results.length === 0 && q.trim() && (
            <div style={{ ...styles.small, marginTop: 10 }}>
              No encontramos canciones para “{q}”. Intenta con otro término.
            </div>
          )}
        </div>

        {err && <div style={styles.error}>⚠️ {err}</div>}
      </div>

      {/* Estado del último pedido */}
      {lastRequest && (
        <div style={styles.statusCard}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            ¡Listo! Agregaste: {lastRequest.title} — {lastRequest.artist}
          </div>
          <div style={styles.small}>
            {position !== null
              ? (
                <>
                  Tu canción está en la posición <b>#{position}</b> de{" "}
                  <b>{totalActive}</b> solicitudes activas.
                </>
                )
              : "Calculando posición…"}
          </div>
          <div style={{ ...styles.small, marginTop: 6 }}>
            Estado: <b>{lastRequest.status}</b> (se actualiza automáticamente).
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteSpotify;
