import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import TournamentListPage from './pages/TournamentListPage.jsx'
import CreateTournamentPage from './pages/CreateTournamentPage.jsx'
import TournamentDetailPage from './pages/TournamentDetailPage.jsx'

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route path="tournaments" element={<TournamentListPage />} />
                <Route path="tournaments/new" element={<CreateTournamentPage />} />
                <Route path="tournaments/:id" element={<TournamentDetailPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </I18nProvider>
  )
}
