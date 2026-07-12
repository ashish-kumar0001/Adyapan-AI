"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] [${this.props.moduleName || "General"}] Caught error:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "16px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "260px",
            width: "100%",
            boxSizing: "border-box",
            gap: "1rem",
            margin: "1rem 0",
          }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 0.4rem 0",
              }}
            >
              Failed to load {this.props.moduleName || "Component"}
            </h4>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                maxWidth: "320px",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              An unexpected error occurred while rendering this widget. You can attempt to reload the component.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
            }}
          >
            <RefreshCw size={14} /> Retry Widget
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
