"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InstallPWALink() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or if already installed/not supported
      toast.info("How to install", {
        description: "Tap your browser's Share or Menu button, then select 'Add to Home Screen'.",
        duration: 5000,
      });
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  return (
    <li>
      <button 
        onClick={handleInstallClick}
        className="group relative inline-block text-stone-500 hover:text-red-900 transition-colors duration-300 text-sm font-medium text-left"
      >
        Install App
        <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-stone-900 transition-transform duration-300 scale-x-0 group-hover:scale-x-100 origin-left"></span>
      </button>
    </li>
  );
}
