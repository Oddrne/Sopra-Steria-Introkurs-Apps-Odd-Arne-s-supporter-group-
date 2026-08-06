import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function RequireAuth() {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Outlet />
}
