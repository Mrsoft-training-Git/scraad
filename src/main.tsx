import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startVersionCheck } from "./lib/version-check";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Auto-reload when a new deployed version is detected (production only)
startVersionCheck();

