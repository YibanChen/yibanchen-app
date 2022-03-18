import React from "react";
import * as Sentry from "@sentry/react";
import "../pages/style.css";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  logErrorToMyService = (error, errorInfo) => {
    console.log(error, errorInfo);
  };

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error or send logging data to log management tool
    Sentry.captureException(error);
    this.logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return <h1 className="white-text">Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
