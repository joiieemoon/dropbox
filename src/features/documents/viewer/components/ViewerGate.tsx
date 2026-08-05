/**
 * ViewerGate - access control state machine for the public viewer.
 *
 * States: verifying → email_required → otp_required → granted → denied
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  verifyToken,
  submitEmail,
  verifyOtp,
  grantSession,
} from "../../api/viewerApi";
import { useViewerSessionStore } from "../store/viewerSessionStore";
import type { ViewerGateState } from "../../types";
import type { Document } from "../../types";

interface ViewerGateProps {
  /** Rendered once access is granted. */
  children: (document: Document) => React.ReactNode;
}

export default function ViewerGate({ children }: ViewerGateProps) {
  const { token } = useParams<{ token: string }>();
  const setSession = useViewerSessionStore((s) => s.setSession);

  const [state, setState] = useState<ViewerGateState>("verifying");
  const [document, setDocument] = useState<Document | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verify the token on mount.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState("denied");
      return;
    }

    setState("verifying");
    verifyToken(token)
      .then((result) => {
        if (cancelled) return;
        if (!result.valid || !result.document) {
          setState("denied");
          return;
        }
        setDocument(result.document);
        // For the POC, the mock always knows the email, so go straight to OTP.
        // In a real system, if !result.emailKnown we'd go to "email_required".
        setState(result.emailKnown ? "otp_required" : "email_required");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await submitEmail(token, email);
        if (result.success) {
          setState("otp_required");
        } else {
          setError(result.message);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [token, email],
  );

  const handleOtpSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await verifyOtp(token, otp);
        if (!result.success) {
          setError(result.message);
          return;
        }
        const session = await grantSession(token);
        setSession(session);
        setState("granted");
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [token, otp, setSession],
  );

  // ---- Render per state ----

  if (state === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verifying your access link…
          </p>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
            Access Denied
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This link is invalid or has expired. Please contact the sender for a
            new link.
          </p>
        </div>
      </div>
    );
  }

  if (state === "email_required") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white">
            {document?.name ?? "Secure Document"}
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive a one-time passcode.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (state === "otp_required") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white">
            {document?.name ?? "Secure Document"}
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-digit code sent to your email.
          </p>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                One-time passcode
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & View"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // state === "granted"
  if (!document) {
    return null;
  }

  return <>{children(document)}</>;
}