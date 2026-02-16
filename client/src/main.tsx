/**
 * main.tsx — Application entry point.
 *
 * Mounts the root <App /> component into the #root div defined in index.html.
 * Wrapped in React StrictMode for development-time warnings about unsafe
 * lifecycle methods and deprecated APIs.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
