import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import CardsPage from "./pages/CardsPage";
import AdsPage from "./pages/AdsPage";
import CollectionsPage from "./pages/CollectionsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <NavBar />
      <div id="app" style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/karty" replace />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          
          <Route path="/karty" element={<CardsPage />} />
          <Route path="/ogloszenia" element={<AdsPage />} />
          <Route path="/kolekcje" element={<CollectionsPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}