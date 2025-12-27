import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { initWebVitals } from "./lib/web-vitals";
import { logEnvValidation } from "./lib/env-validation";

// Geist font (Vercel's premium typeface)
import "@fontsource-variable/geist";
import "@fontsource/geist-mono";

// Initialize Sentry error tracking
initSentry();

// Initialize Web Vitals monitoring
initWebVitals();

// Log environment validation in development
logEnvValidation();

createRoot(document.getElementById("root")!).render(<App />);
