"use client";

import React from "react";
import { reportError } from "./ErrorReporter";

/**
 * Catches render errors, which window.onerror never sees because React
 * intercepts them first.
 *
 * Without this, a throw inside a component unmounts the whole tree and leaves
 * a blank page -- the worst failure mode there is, because the user cannot
 * tell it from the site being down and there is nothing to report.
 *
 * Still a class component: React has no hook equivalent of
 * componentDidCatch, so this is the only way to do it.
 */

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error.message, {
      stack: error.stack ?? null,
      source: "boundary",
      // The component stack names the component that threw, which the JS stack
      // often does not once the code has been minified.
      context: { componentStack: info.componentStack?.slice(0, 2000) ?? null },
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-semibold text-slate-100">
          Something went wrong on this page
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-400">
          The problem has been recorded automatically. Reloading usually helps;
          if it keeps happening, the details have already been sent and nothing
          further is needed from you.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-teal-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
        >
          Reload the page
        </button>
      </div>
    );
  }
}
