// src/pages/ClienteSpotify.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { musicClient } from "../services/musicClient";
import apiSessions from "../services/apiSessions"; // default import

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

  let duration_ms: number | undefined =
    raw?.duration_ms ??
    raw?.track?.duration_ms ??
    raw?.data?.duration?.totalMilliseconds ??
    raw?.duration?.totalMilliseconds ??
    undefined;

  if (duration_ms == null) {
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

/* ---------- Config ---------- */
const REDIRECT_DELAY_MS = 3500;
const HEARTBEAT_MS = 70_000; // ~70s
const USER_ACTIVE_WINDOW_MS = 90_000; // si no hubo interacción en 90s, no ping

/* ---------- Página ---------- */
const ClienteSpotify: React.FC<{ sessionId?: string; mesaId?: string }> = ({
  sessionId: sessionIdProp,
  mesaId: mesaIdProp,
}) => {
  const navigate = useNavigate();

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

  // Toast (para avisos menores)
  const [toastText, setToastText] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);
  const redirectTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) window.clearTimeout(redirectTimeoutRef.current);
    };
  }, []);
  const showToast = useCallback((text: string) => {
    setToastText(text);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), REDIRECT_DELAY_MS);
  }, []);

  const scheduleRedirectToDashboard = useCallback(() => {
    if (redirectTimeoutRef.current) window.clearTimeout(redirectTimeoutRef.current);
    redirectTimeoutRef.current = window.setTimeout(() => navigate("/"), REDIRECT_DELAY_MS);
  }, [navigate]);

  // ========= Overlay centrado (mensajes importantes) =========
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const overlayTimerRef = useRef<number | null>(null);

  const showOverlay = useCallback((text: string, autoHideMs?: number) => {
    setOverlayText(text);
    if (overlayTimerRef.current) {
      window.clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    if (autoHideMs && autoHideMs > 0) {
      overlayTimerRef.current = window.setTimeout(() => {
        setOverlayText(null);
        overlayTimerRef.current = null;
      }, autoHideMs);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
    };
  }, []);

  // Intentar cerrar pestaña (silencioso; si no se puede, no molesta)
  const attemptCloseTab = useCallback(() => {
    try {
      window.close();
    } catch {}
    try {
      const w = window.open("", "_self");
      w?.close?.();
    } catch {}
  }, []);

  // ---------- Helpers de sesión expirada ----------
  const isSessionExpiredError = useCallback((e: any): boolean => {
    const status = e?.response?.status ?? e?.status;
    const code =
      e?.response?.data?.code ||
      (() => {
        try {
          const parsed = JSON.parse(e?.message || "{}");
          return parsed?.code;
        } catch {
          return undefined;
        }
      })();
    return (
      status === 410 ||
      (status === 403 && (code === "SESSION_EXPIRED" || code === "SESSION_INVALID")) ||
      (status === 401 && code === "NO_SESSION") ||
      code === "SESSION_EXPIRED"
    );
  }, []);

  const handleSessionExpired = useCallback(() => {
    try {
      localStorage.removeItem("sessionId");
    } catch {}
    try {
      localStorage.removeItem("mesaId");
    } catch {}

    // Overlay centrado + intento de cierre + redirect de respaldo
    showOverlay("Sesión cerrada por inactividad. Vuelve a escanear el QR de tu mesa.");
    window.setTimeout(attemptCloseTab, 1200);
    scheduleRedirectToDashboard();
  }, [showOverlay, scheduleRedirectToDashboard, attemptCloseTab]);

  /* ====== Heartbeat/ping: SOLO si hay interacción reciente y la pestaña está visible ====== */
  const lastInteractionRef = useRef<number>(Date.now());

  useEffect(() => {
    const mark = () => { lastInteractionRef.current = Date.now(); };
    window.addEventListener("pointerdown", mark, { passive: true });
    window.addEventListener("keydown", mark);
    window.addEventListener("touchstart", mark, { passive: true });
    window.addEventListener("focus", mark);

    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("touchstart", mark);
      window.removeEventListener("focus", mark);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const doPing = async () => {
      if (!sessionId) return;
      if (document.hidden) return;
      const idleFor = Date.now() - lastInteractionRef.current;
      if (idleFor > USER_ACTIVE_WINDOW_MS) return;

      try {
        if (typeof (apiSessions as any)?.ping === "function") {
          await (apiSessions as any).ping(sessionId);
        } else {
          return;
        }
      } catch (e: any) {
        if (cancelled) return;
        if (isSessionExpiredError(e)) {
          handleSessionExpired();
        }
      }
    };

    if (!document.hidden) doPing();

    const intervalId = window.setInterval(doPing, HEARTBEAT_MS);
    const onVis = () => { if (!document.hidden) doPing(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sessionId, isSessionExpiredError, handleSessionExpired]);

  /* ====== Cerrar sesión al cerrar pestaña/ventana ====== */
  const closeOnExitSentRef = useRef(false);
  const closeSessionOnExit = useCallback(() => {
    if (closeOnExitSentRef.current) return;
    closeOnExitSentRef.current = true;
    if (!sessionId) return;

    const base = (process.env.REACT_APP_API_BASE_URL as string) || "";
    const url = `${base}/api/sessions/${sessionId}/close`;
    const payload = JSON.stringify({});

    try {
      if ("sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // ignorar
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const onPageHide = () => closeSessionOnExit();
    const onBeforeUnload = () => closeSessionOnExit();
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [sessionId, closeSessionOnExit]);

  // Buscar con debounce (mobile-first)
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const id = window.setTimeout(async () => {
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
        setResults(Array.isArray(rawItems) ? rawItems.slice(0, 12) : []);
      } catch (e: any) {
        setErr(e?.message || "No se pudo buscar");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [q]);

  // Posición en la cola
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
      // Overlay centrado para este caso
      showOverlay("No hay sesión activa. Pídele al staff que abra tu mesa.", 3000);
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
    if (p.uri && /^spotify:track:[A-Za-z0-9]+$/.test(p.uri)) payload.trackUri = p.uri;
    else if (p.id && /^[A-Za-z0-9]+$/.test(p.id)) payload.trackId = p.id;
    else if (p.url && /open\.spotify\.com\/track\//i.test(p.url)) payload.trackUrl = p.url;
    else if (p.uri && p.uri.startsWith("spotify:track:")) {
      const guessedId = p.uri.split(":")[2];
      if (guessedId) payload.trackId = guessedId;
    }

    try {
      const resp: any = await musicClient.createRequest(payload);
      const doc = resp?.request;
      if (!doc) throw new Error("Respuesta inesperada del servidor");

      const { pos, total } = await calcPosition(doc._id);

      // Overlay centrado para el mensaje de éxito + redirección
      showOverlay(
        pos
          ? `Tu canción ha sido agregada. Posición #${pos} de ${total}.`
          : "Tu canción ha sido agregada a la cola."
      );
      setQ("");
      setResults([]);
      scheduleRedirectToDashboard();
    } catch (e: any) {
      if (isSessionExpiredError(e)) {
        handleSessionExpired();
        return;
      }
      try {
        const parsed = JSON.parse(e.message);
        showToast(parsed?.msg || e.message);
      } catch {
        showToast(e?.message || "No se pudo crear la solicitud");
      }
    }
  };

  return (
    <div className="cs-page">
      {/* estilos mobile-first + overlay centrado */}
      <style>{`
        :root{
          --gold:#c3a24a;
          --panel:rgba(12,12,12,0.35);
          --soft:rgba(0,0,0,0.35);
          --text:#e6d8a8;
        }
        .cs-page, .cs-page * { box-sizing: border-box; }

        .cs-page{
          min-height:100svh;
          padding:16px 12px 80px;
          color:var(--gold);
          font-family:'Orbitron',sans-serif;
          position:relative;
          overflow-x:hidden;
        }
        .cs-bg{
          position:fixed; inset:0;
          background-image:url('https://images.unsplash.com/photo-1597290282695-edc43d0e7129?q=80&w=1475&auto=format&fit=crop');
          background-size:cover; background-position:center;
          filter:blur(1.5px) brightness(.78) contrast(1);
          z-index:-2;
        }
        .cs-overlay{
          position:fixed; inset:0;
          background:radial-gradient(ellipse at 50% 30%, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 60%, rgba(0,0,0,.72) 100%);
          z-index:-1;
        }

        .cs-header{ width:100%; max-width:640px; margin:0 auto 10px; }
        .cs-title{
          text-align:center; font-size:1.6rem; line-height:1.2; font-weight:800;
          color:rgba(255,215,128,.92); margin:0 0 6px;
          text-shadow:0 0 6px rgba(255,215,128,.4),0 0 12px rgba(255,215,128,.3),0 0 20px rgba(255,215,128,.2);
        }
        .cs-sub{ text-align:center; color:rgba(255,255,255,.88); font-size:.95rem; margin-bottom:14px; }

        .cs-card{
          width:100%; max-width:640px; margin:0 auto;
          background:var(--panel); backdrop-filter:blur(6px);
          border:1px solid rgba(195,162,74,.35);
          border-radius:14px; box-shadow:0 6px 16px var(--soft);
          padding:12px;
        }

        .cs-row{
          display:grid; grid-template-columns: 1fr;
          gap:10px; align-items:stretch;
        }
        .cs-input{
          width:100%; min-width:0; padding:14px 14px;
          background:rgba(0,0,0,.5); color:var(--text);
          border:1px solid rgba(195,162,74,.35); border-radius:12px;
          outline:none; font-size:16px;
        }
        .cs-actions{
          display:flex; align-items:center; gap:10px; width:100%;
        }
        .cs-btn{
          appearance:none; -webkit-appearance:none;
          background:var(--panel); color:var(--gold);
          padding:12px 16px; border:1px solid rgba(195,162,74,.4);
          border-radius:12px; font-size:1rem; font-weight:700;
          cursor:pointer; box-shadow:0 6px 16px var(--soft);
          min-height:44px;
        }
        .cs-small{ font-size:.9rem; color:rgba(255,255,255,.9); }

        .cs-list{ margin-top:10px; display:grid; gap:10px; }
        .cs-item{
          display:grid; grid-template-columns:auto 1fr auto;
          gap:10px; align-items:center; padding:10px;
          border-radius:12px; border:1px solid rgba(195,162,74,.25);
          background:rgba(0,0,0,.35); min-height:64px;
        }
        .cs-cover{
          width:56px; height:56px; object-fit:cover;
          border-radius:10px; border:1px solid rgba(195,162,74,.25);
        }
        .cs-titleArtist{ font-weight:800; }
        .cs-subline{ opacity:.9; }
        .cs-err{ margin-top:10px; color:#ffb3b3; }

        .cs-toast{
          position:fixed; left:50%; bottom:18px; transform:translateX(-50%);
          background:rgba(12,12,12,.72); color:#f8e7b3;
          border:1px solid rgba(195,162,74,.55); padding:10px 14px;
          border-radius:12px; box-shadow:0 8px 22px rgba(0,0,0,.45);
          max-width:92vw; text-align:center; z-index:5;
          transition:opacity .25s ease, transform .25s ease;
        }
        .cs-toast.hide{ opacity:0; transform:translate(-50%, 10px); }

        /* ===== Overlay centrado ===== */
        .cs-screen{
          position:fixed; inset:0;
          display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,.55);
          backdrop-filter: blur(6px);
          opacity:0; visibility:hidden; z-index:20;
          transition: opacity .25s ease, visibility .25s ease;
        }
        .cs-screen.show{ opacity:1; visibility:visible; }
        .cs-modal-box{
          background:rgba(16,16,16,.85);
          border:1px solid rgba(195,162,74,.45);
          color:#f8e7b3;
          padding:18px 16px;
          border-radius:14px;
          box-shadow:0 14px 36px rgba(0,0,0,.55);
          width:min(560px, 92vw);
          text-align:center;
          font-size:1rem;
        }

        /* ===== Mejora progresiva pantallas anchas ===== */
        @media (min-width: 640px){
          .cs-title{ font-size:1.9rem; }
          .cs-card{ padding:14px; }
          .cs-row{ display:flex; flex-wrap:nowrap; align-items:center; }
          .cs-input{ flex:1 1 360px; }
          .cs-actions{ width:auto; }
        }
        @media (min-width: 960px){
          .cs-header, .cs-card{ max-width:900px; }
          .cs-title{ font-size:2.2rem; }
          .cs-item{ padding:12px; }
          .cs-cover{ width:60px; height:60px; }
        }
      `}</style>

      <div className="cs-bg" aria-hidden="true" />
      <div className="cs-overlay" aria-hidden="true" />

      <header className="cs-header">
        <h1 className="cs-title">Pide tu canción</h1>
        <p className="cs-sub">Busca tu canción favorita, añádela a la cola del bar y mira tu posición.</p>
      </header>

      <section className="cs-card" role="search">
        <div className="cs-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por canción o artista…"
            className="cs-input"
            inputMode="search"
            autoComplete="off"
            aria-label="Buscar canción o artista"
          />
          <div className="cs-actions">
            <button className="cs-btn" onClick={() => setQ("")} aria-label="Limpiar búsqueda">
              Limpiar
            </button>
            <div className="cs-small" aria-live="polite">
              {searching ? "Buscando…" : results.length ? `${results.length} resultados` : "—"}
            </div>
          </div>
        </div>

        <div className="cs-list">
          {results.map((t, i) => {
            const p = parseTrackItem(t);
            return (
              <div key={p.uri || p.id || i} className="cs-item">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="cs-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="cs-cover"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "1.2rem",
                    }}
                    aria-hidden="true"
                  >
                    ♪
                  </div>
                )}

                <div>
                  <div className="cs-titleArtist">{p.name || "—"}</div>
                  <div className="cs-subline">{p.artistNames || "—"}</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div className="cs-small" style={{ minWidth: 56, textAlign: "right" }}>
                    {msToMinSec(p.duration_ms)}
                  </div>
                  <button
                    className="cs-btn"
                    onClick={() => pedirCancion(t)}
                    aria-label={`Pedir ${p.name || "canción"} de ${p.artistNames || "artista"}`}
                  >
                    Pedir
                  </button>
                </div>
              </div>
            );
          })}

        {!searching && results.length === 0 && q.trim() && (
            <div className="cs-small" style={{ marginTop: 10 }}>
              No encontramos canciones para “{q}”. Intenta con otro término.
            </div>
          )}
        </div>

        {err && <div className="cs-err">⚠️ {err}</div>}
      </section>

      {/* Toast inferior (para mensajes no críticos) */}
      <div className={`cs-toast ${toastVisible ? "" : "hide"}`} role="status" aria-live="polite">
        {toastText}
      </div>

      {/* Overlay centrado */}
      <div className={`cs-screen ${overlayText ? "show" : ""}`}>
        <div className="cs-modal-box" role="dialog" aria-live="polite">
          {overlayText}
        </div>
      </div>
    </div>
  );
};

export default ClienteSpotify;
