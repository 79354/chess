import React from "react";
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/NavBar'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Register from "./pages/Register";
import Login from "./pages/Login"
import NotFound from './pages/NotFound';
import Home from './pages/Home'
import Profile from './pages/Profile'
import { AuthProvider } from "./context/AuthContext";

function AppRouter() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element />
                <Route path="/register" element />

                <Route path="/*" 
                    element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                    } 
                />
            </Routes>
        </AuthProvider>
    );
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default AppRouter;