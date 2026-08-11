import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerLicense } from "@syncfusion/ej2-base";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-lists/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-splitbuttons/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-react-documenteditor/styles/material.css";

// Register the Syncfusion license key.
// Add your free community license key via the VITE_SYNC_FUSION_LICENSE env var
// (e.g. in .env.development), or replace the fallback string below directly.
const syncFusionLicense = import.meta.env.VITE_SYNC_FUSION_LICENSE as string | undefined;
if (syncFusionLicense) {
  registerLicense(syncFusionLicense);
}

import { AppWrapper } from "./components/common/pagemeta/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { RouterProvider } from "react-router-dom";
import { router } from "./route";
import ToastProvider from "./components/common/toast/ToastProvider.tsx";
import { Provider } from "react-redux";
import { store, persistor } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/query";
import "./api/client/interceptor";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <AppWrapper>
                <RouterProvider router={router} />
              </AppWrapper>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);