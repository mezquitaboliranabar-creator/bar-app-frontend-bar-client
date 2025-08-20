// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";

// 🧩 Puente: si la URL viene como /mesa/abc (sin hash), redirigimos a /#/mesa/abc
if (window.location.pathname !== "/" && !window.location.hash) {
  const newUrl = "/#" + window.location.pathname + window.location.search + window.location.hash;
  window.location.replace(newUrl);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
