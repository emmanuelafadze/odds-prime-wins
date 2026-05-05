import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { HeadManager, router, ScriptManager } from "./router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HeadManager />
    <RouterProvider router={router} />
    <ScriptManager />
  </React.StrictMode>,
);