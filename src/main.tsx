import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Registrar o service worker para PWA
registerSW({
  onOfflineReady() {
    console.log("Aplicação disponível offline");
  },
  onNeedRefresh() {
    console.log("Nova versão disponível - recarregue a página");
  },
  onRegistered(registration) {
    console.log("Service Worker registrado:", registration);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
