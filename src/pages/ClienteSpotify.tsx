// src/pages/ClienteSpotify.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { musicClient } from "../services/musicClient";

/* ---------- Utils ---------- */
function msToMinSec(ms?: number) {
  if (ms == null || Number.isNaN(ms)) return "--:--";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function firstUrlFromArray(arr: any[]): string | undefined {
  if (!Array.isArray(arr)) return undefined;
  for (const x of arr) {
    if (typeof x === "string" && x) return x;
    if (x && typeof x.url === "string" && x.url) return x.url;
  }
  return undefined;
}

/* Normaliza un item de búsqueda a un formato común */
function parseTrackItem(raw: any) {
  const id =
    raw?.id || raw?.track?.id || raw?.data?.id || raw?.data?.uid || undefined;

  const uriRaw =
    raw?.uri || raw?.data?.uri || raw?.track?.uri || raw?.trackUri || undefined;

  const uri = uriRaw || (id ? `spotify:track:${id}` : "");

  const extUrl =
    raw?.external_urls?.spotify ||
    raw?.track?.external_urls?.spotify ||
    raw?.externalUrl ||
    undefined;

  const name =
    raw?.name || raw?.data?.name || raw?.track?.name || raw?.title || "";

  const artistNames =
    (raw?.artists?.map((a: any) => a?.name).join(", ")) ||
    (raw?.data?.artists?.items?.map((a: any) => a?.profile?.name).join(", ")) ||
    (raw?.track?.artists?.map((a: any) => a?.name).join(", ")) ||
    raw?.artist ||
    "";

  // Intentos para encontrar cover
  const imgCandidates =
    raw?.album?.images ||
    raw?.track?.album?.images ||
    raw?.images ||
    raw?.imageArray ||
    raw?.data?.albumOfTrack?.coverArt?.sources ||
    raw?.coverArt?.sources ||
    raw?.covers ||
    [];

  const imageUrl =
    raw?.imageUrl ||
    raw?.albumImageUrl ||
    firstUrlFromArray(imgCandidates) ||
    raw?.cover?.url ||
    raw?.picture ||
    undefined;

  // Duración: múltiples formatos
  let duration_ms: number | undefined =
    raw?.duration_ms ??
    raw?.track?.duration_ms ??
    raw?.data?.duration?.totalMilliseconds ??
    raw?.duration?.totalMilliseconds ??
    undefined;

  if (duration_ms == null) {
    // a veces viene duration en segundos
    const sec =
      raw?.duration_seconds ??
      raw?.durationSec ??
      (typeof raw?.duration === "number" ? raw.duration : undefined);
    if (typeof sec === "number") duration_ms = sec * 1000;
  }
  if (typeof duration_ms === "string") {
    const n = Number(duration_ms);
    duration_ms = Number.isFinite(n) ? n : undefined;
  }

  return { id, uri, url: extUrl, name, artistNames, imageUrl, duration_ms };
}

/* ---------- Estilos estáticos ---------- */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "20px 12px 70px",
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
    // Igual que el Dashboard:
    filter: "blur(1px) brightness(0.75) contrast(1)",
    zIndex: -2,
  },
  overlay: {
    content: "''",
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.7) 100%)",
    zIndex: -1,
  },
  headerWrap: {
    position: "relative",
    maxWidth: 960,
    margin: "0 auto 8px",
  },
  backBtn: {
    position: "absolute",
    left: 0,
    top: 0,
    background: "rgba(12,12,12,0.35)",
    color: "#c3a24a",
    padding: "10px 14px",
    border: "1px solid rgba(195,162,74,0.4)",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
    textDecoration: "none",
  },
  title: {
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 800,
    color: "rgba(255, 215, 128, 0.9)",
    marginBottom: 6,
    textShadow:
      "0 0 6px rgba(255,215,128,0.4), 0 0 12px rgba(255,215,128,0.3), 0 0 20px rgba(255,215,128,0.2)",
  },
  subtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16,
    fontSize: "0.95rem",
  },
  card: {
    maxWidth: 960,
    margin: "0 auto",
    background: "rgba(12,12,12,0.35)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(195,162,74,0.35)",
    borderRadius: 14,
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
    padding: 12,
  },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  input: {
    flex: "1 1 360px",
    minWidth: 0,
    padding: "12px 14px",
    background: "rgba(0,0,0,0.5)",
    color: "#e6d8a8",
    border: "1px solid rgba(195,162,74,0.35)",
    borderRadius: 10,
    outline: "none",
    fontSize: "16px", // evita zoom en iOS
  },
  button: {
    background: "rgba(12,12,12,0.35)",
    color: "#c3a24a",
    padding: "10px 14px",
    border: "1px solid rgba(195,162,74,0.4)",
    borderRadius: 12,
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
  },
  small: { fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" },
  list: { marginTop: 10 },
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
  error: { marginTop: 10, color: "#ffb3b3" },
};

/* ---------- Helpers de estilo dinámico ---------- */
const styleEntrance = (visible: boolean): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0)" : "translateY(16px)",
  transition: "opacity .35s ease, transform .35s ease",
});

const styleToast = (visible: boolean): React.CSSProperties => ({
  position: "fixed",
  left: "50%",
  bottom: 18,
  transform: `translateX(-50%) ${visible ? "translateY(0)" : "translateY(10px)"}`,
  opacity: visible ? 1 : 0,
  transition: "opacity .25s ease, transform .25s ease",
  background: "rgba(12,12,12,0.7)",
  color: "#f8e7b3",
  border: "1px solid rgba(195,162,74,0.55)",
  padding: "10px 14px",
  borderRadius: 12,
  boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
  zIndex: 5,
  maxWidth: "92vw",
  textAlign: "center",
});

/* ---------- Página ---------- */
const ClienteSpotify: React.FC<{ sessionId?: string; mesaId?: string }> = ({
  sessionId: sessionIdProp,
  mesaId: mesaIdProp,
}) => {
  const navigate = useNavigate();

  // Animación de entrada
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

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

  // Toast
  const [toastText, setToastText] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (text: string) => {
    setToastText(text);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

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

  // Calcula posición en la cola de solicitudes activas
  const calcPosition = async (reqId: string) => {
    const list: any = await musicClient.activeRequests();
    const items: any[] = list?.items || [];
    const idx = items.findIndex((x) => x._id === reqId);
    const pos = idx >= 0 ? idx + 1 : null;
    const total = list?.total ?? items.length ?? 0;
    return { pos, total };
  };

  // Pedir canción
  const pedirCancion = async (t: any) => {
    setErr(null);
    if (!sessionId) {
      showToast("No hay sesión activa. Pídele al staff que abra tu mesa.");
      return;
    }

    const p = parseTrackItem(t);
    const payload: any = {
      sessionId,
      mesaId,
      title: p.name || "—",
      artist: p.artistNames || "—",
      imageUrl: p.imageUrl,
    };

    if (p.uri && /^spotify:track:[A-Za-z0-9]+$/.test(p.uri)) {
      payload.trackUri = p.uri;
    } else if (p.id && /^[A-Za-z0-9]+$/.test(p.id)) {
      payload.trackId = p.id;
    } else if (p.url && /open\.spotify\.com\/track\//i.test(p.url)) {
      payload.trackUrl = p.url;
    } else if (p.uri && p.uri.startsWith("spotify:track:")) {
      const guessedId = p.uri.split(":")[2];
      if (guessedId) payload.trackId = guessedId;
    }

    try {
      const resp: any = await musicClient.createRequest(payload);
      const doc = resp?.request;
      if (!doc) throw new Error("Respuesta inesperada del servidor");

      const { pos, total } = await calcPosition(doc._id);
      showToast(
        pos
          ? `Tu canción ha sido agregada a la cola de reproducción. Posición #${pos} de ${total}.`
          : "Tu canción ha sido agregada a la cola de reproducción."
      );

      // Limpia búsqueda/resultados
      setQ("");
      setResults([]);
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message);
        showToast(parsed?.msg || e.message);
      } catch {
        showToast(e?.message || "No se pudo crear la solicitud");
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg}></div>
      <div style={styles.overlay}></div>

      <div style={styles.headerWrap}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ← Volver
        </button>
        <h1 style={{ ...styles.title, ...styleEntrance(true) }}>Pide tu canción</h1>
        <div style={{ ...styles.subtitle, ...styleEntrance(true) }}>
          Busca tu canción favorita, añádela a la cola del bar y mira tu posición.
        </div>
      </div>

      {/* Buscador */}
      <div style={{ ...styles.card, ...styleEntrance(true) }}>
        <div style={styles.row}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por canción o artista…"
            style={styles.input}
            inputMode="search"
            autoComplete="off"
          />
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
              <div key={p.uri || p.id || i} style={styles.itemRow}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    style={styles.cover}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
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

      {/* Toast */}
      <div style={styleToast(toastVisible)}>{toastText}</div>
    </div>
  );
};

export default ClienteSpotify;
