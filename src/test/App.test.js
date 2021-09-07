import React from "react";
import Loader from "react-loader-spinner";
import { mount, configure, shallow } from "enzyme";
import { expect } from "chai";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import YibanNavbar from "../components/Navbar";
import Notes from "../pages/Notes";
import Settings from "../pages/Settings";
import About from "../pages/About";
import Compose from "../pages/Compose";
import NotFound from "../pages/NotFound";
import chai from "chai";
import chaiEnzyme from "chai-enzyme";
import Adapter from "enzyme-adapter-react-16";
import App from "../App";
import AccountListItem from "../components/AccountListItem";
import { setupServer } from "msw/node";
import { rest } from "msw";
import axios from "axios";
import { act } from "react-dom/test-utils";

configure({
  adapter: new Adapter(),
});

let store = {};

var mockLocalStorage = {
  getItem: function (key) {
    return store[key];
  },
  setItem: function (key, val) {
    store[key] = val;
  },
};

global.window = { localStorage: mockLocalStorage };
global.localStorage = window.localStorage;

const server = setupServer(
  rest.post("/login", (req, res, ctx) => {
    console.log("hi");
    // Respond with a mocked user token that gets persisted
    // in the `sessionStorage` by the `Login` component.
    return res(ctx.json({ token: "mocked_user_token" }));
  }),

  rest.get("https://ipfs.io/ipfs(/*)", (req, res, ctx) => {
    return res(
      ctx.delay(1500),
      ctx.status(202, "Mocked status"),
      ctx.json({
        data: {
          message: "Mocked response JSON body",
          timestamp: "2021-07-27T18:38:55.028Z",
          sender: "5EFR4EEtvCA8EW3X87CZrUx1Sncr7tpVrJHjWmqRbarTkF61",
          subject: "test subject",
        },
      })
    );
  })
);

beforeEach(async () => {
  server.listen();
  localStorage.setItem(
    "currentAccount",
    JSON.stringify({
      address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
      meta: { name: "max test" },
    })
  );
});

afterEach(function () {
  server.close();
});

describe("Testing <App/>", () => {
  it("renders", () => {
    const wrapper = shallow(<App />);
    const message = (
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
    expect(wrapper).to.contain(message);
  });
  chai.use(chaiEnzyme());
});

describe("Testing the inbox", function () {
  it("Render properly before the IPFS call", async function () {
    axios.defaults.adapter = require("axios/lib/adapters/http");
    const wrapper = shallow(<Notes />);
    expect(wrapper.find("parent")).to.have.length(0);
    await new Promise((res) =>
      setTimeout(() => {
        res("");
      }, 0)
    );
    wrapper.update();
  });

  it("Renders the loader", function (done) {
    const wrapper = shallow(<Notes />);
    // global.address = "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH";
    const expectedLoader = (
      <div className="centered m-4 p-1">
        <Loader type="Puff" color="#02C3FC" height={200} width={200} />
        <h1 className="m-4 robot">Loading Messages</h1>
      </div>
    );
    const actualValue = wrapper.contains(expectedLoader);
    expect(actualValue).to.equal(true);
    done();
  });
});

describe("Testing Account List Item component", function () {
  it("should render properly", function () {
    // global.address = "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH";
    const testAcc = {
      address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
      meta: { name: "max test" },
    };
    const wrapper = shallow(<AccountListItem account={testAcc} />);
  });
  it("should have prop for account", function () {
    const testAcc = {
      address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
      meta: { name: "max test" },
    };
    const wrapper = shallow(<AccountListItem account={testAcc} />);
  });
});

describe("Testing settings", function () {
  it("should render properly", function () {
    const wrapper = shallow(<Settings />);
    const testAcc = {
      address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
      meta: { name: "max test" },
    };
  });
});
