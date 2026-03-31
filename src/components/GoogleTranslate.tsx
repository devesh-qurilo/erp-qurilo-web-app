"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    __gt_initialized__?: boolean;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    // ⛔ Already initialized → STOP
    if (window.__gt_initialized__) return;
    window.__gt_initialized__ = true;

    window.googleTranslateElementInit = () => {
      if (!window.google || !window.google.translate) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          // includedLanguages: "en,hi,mr,ta,te,ur,bn,gu,pa",
        includedLanguages: "en,pl,ru,lt,de,nl",


          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // ⛔ Script already exists → STOP
    if (document.getElementById("google-translate-script")) return;

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div id="google_translate_element" style={{ display: "none" }} />;
}
