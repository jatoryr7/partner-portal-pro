import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { GlobalErrorBoundary } from "./components/ui/GlobalErrorBoundary";
import "./index.css";

// Prevent ResizeObserver crashes (e.g. from Recharts/Radix) on fast window resize
const OriginalResizeObserver = window.ResizeObserver;
(window as any).ResizeObserver = class extends OriginalResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);