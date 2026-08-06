"use client";

import { useEffect, useState } from "react";

interface TcData {
  gdprApplies?: boolean;
}

interface GoogleFcApi {
  callbackQueue?: unknown[];
  showRevocationMessage?: () => void;
}

declare global {
  interface Window {
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: TcData, success: boolean) => void
    ) => void;
  }
}

/**
 * Footer link that reopens the consent message so a decision can be changed.
 *
 * UK GDPR requires withdrawing consent to be as easy as giving it, and until
 * now there was no way to do it at all -- once the Funding Choices dialog was
 * answered, the choice was final.
 *
 * The link renders only when GDPR actually applies to the visitor. Showing a
 * dead "cookie settings" link to someone outside the UK and EEA, where
 * clicking it does nothing because there is no consent record to revoke, is
 * worse than not showing it. Rendering nothing by default also means the
 * footer is unchanged if the consent framework fails to load.
 */
export default function ConsentSettingsLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fc = (window as unknown as { googlefc?: GoogleFcApi }).googlefc;
    const googlefc: GoogleFcApi = fc ?? {};
    (window as unknown as { googlefc: GoogleFcApi }).googlefc = googlefc;
    googlefc.callbackQueue = googlefc.callbackQueue || [];

    // CONSENT_API_READY only guarantees __tcfapi exists; the listener then
    // reports whether GDPR applies. Version 0 asks for the newest TCF spec.
    googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        window.__tcfapi?.("addEventListener", 0, (data, success) => {
          setVisible(Boolean(success && data?.gdprApplies));
        });
      },
    });
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const fc = (window as unknown as { googlefc?: GoogleFcApi }).googlefc;
        fc?.showRevocationMessage?.();
      }}
      className="hover:text-slate-200"
    >
      Cookie settings
    </button>
  );
}
