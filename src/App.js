import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import YibanNavbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Compose from "./pages/Compose";
import NotFound from "./pages/NotFound";
import SiteMarketplace from "./pages/SiteMarketplace";
import AllSites from "./pages/AllSites";
import MySites from "./pages/MySites";
import SiteUpload from "./pages/SiteUpload";

import "./index.css";
import "./App.css";

const SentryRoute = Sentry.withSentryRouting(Route);

function App() {
  if (localStorage.getItem("currentAccount") !== undefined) {
    global.currentAccount = localStorage.getItem("currentAccount") || "";
  }

  document.body.style = "background: #131415;";
  document.body.style.overflow = "hidden";

  return (
    <div className="App ubuntu">
      {localStorage.getItem("currentAccount") !== undefined ? (
        <YibanNavbar />
      ) : (
        ""
      )}
      <Router>
        <ErrorBoundary>
          <Switch>
            <SentryRoute path="/" exact component={Home} />
            <SentryRoute path="/about" exact component={About} />
            <SentryRoute path="/inbox" exact component={Notes} />
            <SentryRoute path="/Compose" exact component={Compose} />
            <SentryRoute path="/settings" exact component={Settings} />
            <SentryRoute
              path="/site-marketplace"
              exact
              component={SiteMarketplace}
            />
            <SentryRoute path="/my-sites" exact component={MySites} />
            <SentryRoute path="/upload" exact component={SiteUpload} />
            <SentryRoute path="/all-sites" exact component={AllSites} />

            <SentryRoute component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </Router>
    </div>
  );
}

export default App;
