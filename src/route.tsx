import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { PublicRoute } from "./components/common/routes";
import { ProtectedRoute } from "./components/common/routes";
// import MuiElements from "./features/mui";
// Layouts
const AppLayout = lazy(() => import("./components/layout/AppLayout"));

// Auth
const AuthLayout = lazy(() => import("./features/auth"));

// Auth Pages
const SignIn = lazy(() => import("./features/auth/components/signin-form"));
const SignUp = lazy(() => import("./features/auth/components/signup-form"));

// Other Pages
const NotFound = lazy(() => import("./features/OtherPage"));
const UserProfiles = lazy(() => import("./features/UserProfile/layout"));



// Document Tracking & Analytics POC
const SenderDashboard = lazy(
  () => import("./features/documents/sender/SenderDashboard"),
);
  const AnalyticsDashboard = lazy(
    () => import("./features/documents/analytics/AnalyticsDashboard"),
  );
  const SharedDocuments = lazy(
    () => import("./features/documents/sender/SharedDocuments"),
  );
  const SecureViewer = lazy(
    () => import("./features/documents/viewer/components/SecureViewer"),
  );
  const DocxViewerPage = lazy(
    () => import("./features/documents/sender/DocxViewerPage"),
  );
  const DocxDocumentViewer = lazy(
    () => import("./features/documents/sender/DocxDocumentViewer"),
  );

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
      { index: true, element: <Navigate to="/documents" replace /> },
      { path: "dashboard", element: <Navigate to="/documents" replace /> },
      { path: "documents", element: <SenderDashboard /> },
      { path: "docx-viewer", element: <DocxViewerPage /> },
      { path: "docx-viewer/:id", element: <DocxDocumentViewer /> },

      // Profile
      { path: "profile", element: <UserProfiles /> },

     

      { path: "analytics", element: <AnalyticsDashboard /> },
      { path: "shared-with-me", element: <SharedDocuments /> },
      
      // Direct document viewer for logged-in users with access
      { path: "documents/:id", element: <SecureViewer /> },
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
