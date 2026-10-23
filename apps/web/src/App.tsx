import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { RequireAdmin } from './layouts/AdminLayout';
import { Home } from './pages/Home';
import { Tools } from './pages/Tools';
import { ToolPage } from './pages/ToolPage';
import { ApiPage } from './pages/ApiPage';
import { AccountPage } from './pages/Account';
import { MenuPage } from './pages/Menu';
import { LegalIndex, LegalPage } from './pages/Legal';
import { ForgotPage, LoginPage, RegisterPage, ResetPage, VerifyEmailPage } from './pages/AuthPages';
import { NotFound } from './pages/NotFound';
import { ApiStatsPage, LogsPage, Overview, RolesPage, ServicesPage, UsersPage } from './pages/admin/AdminPages';

export const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Home />} />
      <Route path="outils" element={<Tools />} />
      <Route path="outils/:toolId" element={<ToolPage />} />
      <Route path="api" element={<ApiPage />} />
      <Route path="compte" element={<AccountPage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="connexion" element={<LoginPage />} />
      <Route path="inscription" element={<RegisterPage />} />
      <Route path="verification-email" element={<VerifyEmailPage />} />
      <Route path="verify-email" element={<VerifyEmailPage />} />
      <Route path="mot-de-passe-oublie" element={<ForgotPage />} />
      <Route path="reset-password" element={<ResetPage />} />
      <Route path="legal" element={<LegalIndex />} />
      <Route path="legal/:slug" element={<LegalPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="admin" element={<RequireAdmin />}>
      <Route index element={<Overview />} />
      <Route path="utilisateurs" element={<UsersPage />} />
      <Route path="roles" element={<RolesPage />} />
      <Route path="api" element={<ApiStatsPage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="journaux" element={<LogsPage />} />
    </Route>
  </Routes>
);

export default function App() {
  const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;
  return <Router><AuthProvider><AppRoutes /></AuthProvider></Router>;
}
