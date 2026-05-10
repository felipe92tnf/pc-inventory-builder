import { jsx as _jsx } from "react/jsx-runtime";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AppRouter } from "./app/router";
import "./index.css";
registerSW({ immediate: true });
createRoot(document.getElementById("root")).render(_jsx(BrowserRouter, { children: _jsx(AppRouter, {}) }));
