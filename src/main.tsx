import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";

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