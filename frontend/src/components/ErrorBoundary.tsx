import React, { Component, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[VayuProsecutor ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-danger" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </h2>
            <p className="text-sm text-text-secondary max-w-sm">
              This module encountered an unexpected error. You can retry or switch to another tab.
            </p>
            {this.state.error?.message && (
              <pre className="mt-3 text-xs bg-bg-muted text-text-muted rounded-lg p-3 max-w-md text-left overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
