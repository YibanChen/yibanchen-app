import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Notes from "./pages/Notes";
import YibanNavbar from "./components/Navbar";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Compose from "./pages/Compose";
import NotFound from "./pages/NotFound";
import "./index.css";
import "./App.css";

function App() {
  if (localStorage.getItem("currentAccount") !== undefined) {
    global.currentAccount = localStorage.getItem("currentAccount") || "";
  }

  document.body.style = "background: #333333;";
  document.body.style.overflow = "hidden";
  return (
    <div className="App">
      <Router>
        <YibanNavbar />
        <Switch>
          <Route path="/" exact component={About} />
          <Route path="/inbox" exact component={Notes} />
          <Route path="/Compose" exact component={Compose} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
