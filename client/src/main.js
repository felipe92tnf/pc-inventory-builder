import { jsx as _jsx } from "react/jsx-runtime";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./app/router";
import "./index.css";
createRoot(document.getElementById("root")).render(_jsx(BrowserRouter, { children: _jsx(AppRouter, {}) }));
