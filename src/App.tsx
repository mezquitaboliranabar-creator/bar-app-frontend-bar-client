import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";   // ✅ corregido el nombre del archivo
import Menu from "./pages/Menu";
import MesaPage from "./pages/MesaPage";
import ClienteSpotify from "./pages/ClienteSpotify";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/mesa/:id" element={<MesaPage />} />
      <Route path="/musica" element={<ClienteSpotify />} />

      {/* Catch-all: si cae en cualquier otra ruta, lo llevamos al home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
