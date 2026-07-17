"use client";

import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            background: "#1e293b",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 16,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: 260,
            width: "100%",
            boxSizing: "border-box",
            gap: "1rem",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              borderRadius: "50%",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#f8fafc",
              margin: 0,
            }}
          >
            Something went wrong
          </h3>
          {this.state.error && (
            <code
              style={{
                display: "block",
                maxWidth: 400,
                width: "100%",
                background: "#0B1120",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                fontSize: "0.75rem",
                color: "#fca5a5",
                textAlign: "left",
                wordBreak: "break-word",
                lineHeight: 1.5,
                overflowX: "auto",
              }}
            >
              {this.state.error.message}
            </code>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
