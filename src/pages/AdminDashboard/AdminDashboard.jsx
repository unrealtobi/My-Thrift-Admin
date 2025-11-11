import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // reflect whether beforeinstallprompt was captured
    const check = () => setCanInstall(!!window.deferredInstallPrompt);
    check();
    window.addEventListener("beforeinstallprompt", check);
    window.addEventListener("appinstalled", check);
    return () => {
      window.removeEventListener("beforeinstallprompt", check);
      window.removeEventListener("appinstalled", check);
    };
  }, []);

  const handleInstallClick = async () => {
    if (window.promptInstall) {
      const result = await window.promptInstall();
      // optional: show toast or console — integrate with your toast system
      console.log("Install result:", result);
      // update button state
      setCanInstall(false);
    } else {
      console.warn("Install prompt not available");
    }
  };

  return (
    <div className="p-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-customOrange">Admin Dashboard</h1>
      <div>
        <button
          onClick={handleInstallClick}
          className="bg-blue-600 text-white px-3 py-1 rounded"
          disabled={!canInstall}
          title={!canInstall ? "Install not available yet" : "Install app"}
        >
          Install App
        </button>
      </div>
    </div>
  );
}
