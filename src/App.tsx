// App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dasboard";
import Menu from "./pages/Menu";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
    </Routes>
  );
};

export default App;
