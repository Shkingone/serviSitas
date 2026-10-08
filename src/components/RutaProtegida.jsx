// src/components/RutaProtegida.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RutaProtegida({ rolesPermitidos }) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) return <div>Cargando...</div>;

  // 1. Si no hay usuario autenticado -> Redirigir al Login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el rol del usuario no está en la lista de permitidos -> Redirigir a no autorizado o su panel
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  // 3. Si todo está correcto -> Renderizar la ruta requerida
  return <Outlet />;
}
