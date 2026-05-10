import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./app/router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AppRouter />
  </BrowserRouter>
);
