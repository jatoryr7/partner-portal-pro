import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { GlobalErrorBoundary } from "./components/ui/GlobalErrorBoundary";
import "./index.css";

// Prevent ResizeObserver crashes (e.g. from Recharts/Radix) on fast window resize
const originalResizeObserver = window.ResizeObserver;
window.ResizeObserver = function (callback: ResizeObserverCallback) {
  const wrappedCallback: ResizeObserverCallback = (entries, observer) => {
    window.requestAnimationFrame(() => {
      callback(entries, observer);
    });
  };
  return new originalResizeObserver(wrappedCallback);
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);