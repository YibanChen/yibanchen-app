import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource/ubuntu";
require("typeface-b612");

Sentry.init({
  dsn: "https://15b727a672be40628e4a6c6d93aa0cad@o982640.ingest.sentry.io/5938116",
  integrations: [
    new Integrations.BrowserTracing(),
    new Sentry.Integrations.Breadcrumbs({ console: false }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  ignoreErrors: ["Cancelled", "invalid recipient"],
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
