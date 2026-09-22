import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/Landing";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import NotFoundPage from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Combined sign-in / sign-up screen (existing UI). */}
      <Route path="/auth" element={<AuthPage />} />
      {/* Explicit deep links for the two auth modes. */}
      <Route path="/sign-in" element={<AuthPage initialMode="signin" />} />
      <Route path="/sign-up" element={<AuthPage initialMode="signup" />} />

      {/* Authenticated area. */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
