import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { PublicRoute } from "./components/common/routes";
import { ProtectedRoute } from "./components/common/routes";
import MuiElements from "./features/mui";
// Layouts
const AppLayout = lazy(() => import("./components/layout/AppLayout"));

// Auth
const AuthLayout = lazy(() => import("./features/auth"));

// Dashboard
const Home = lazy(() => import("./features/Dashboard/Home"));

// Auth Pages
const SignIn = lazy(() => import("./features/auth/components/signin-form"));
const SignUp = lazy(() => import("./features/auth/components/signup-form"));

// Other Pages
const NotFound = lazy(() => import("./features/OtherPage"));
const UserProfiles = lazy(() => import("./features/UserProfile/layout"));

// Forms
const FormElements = lazy(() => import("./features/Forms/FormElements"));

// Tables
const BasicTables = lazy(() => import("./features/Tables/BasicTables"));

// Document Tracking & Analytics POC
const SenderDashboard = lazy(() => import("./features/documents/sender/SenderDashboard"));
const AnalyticsDashboard = lazy(() => import("./features/documents/analytics/AnalyticsDashboard"));
const SecureViewer = lazy(() => import("./features/documents/viewer/components/SecureViewer"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/signin" replace /> },
      { path: "signin", element: <SignIn /> },
      { path: "signup", element: <SignUp /> },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Home /> },

      // Profile
      { path: "profile", element: <UserProfiles /> },

      // Forms
      { path: "form-elements", element: <FormElements /> },

      // Tables
      { path: "mui-elements", element: <MuiElements /> },
      { path: "basic-tables", element: <BasicTables /> },

      // Document Tracking & Analytics POC
      { path: "documents", element: <SenderDashboard /> },
      { path: "analytics", element: <AnalyticsDashboard /> },
    ],
  },
  {
    // Public, unauthenticated secure viewer route.
    path: "/v/:token",
    element: <SecureViewer />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);