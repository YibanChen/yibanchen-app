import React from "react";

import { configure, shallow, mount, render } from "enzyme";
import { expect } from "chai";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";

import Notes from "../pages/Notes";
import Settings from "../pages/Settings";
import SiteMarketplace from "../pages/SiteMarketplace";
import AllSites from "../pages/AllSites";
import NotFound from "../pages/NotFound";
import MySites from "../pages/MySites";
import SiteUpload from "../pages/SiteUpload";

import Identicon from "@polkadot/react-identicon";
import { Dropdown, Container } from "react-bootstrap";
import Loader from "react-loader-spinner";

import NoteItem from "../components/NoteItem";
import NoteDetails from "../components/NoteDetails";
import SiteItem from "../components/SiteItem";
import SiteItemNoSale from "../components/SiteItemNoSale";

configure({
  adapter: new Adapter(),
});

global.mount = mount;
global.render = render;
global.shallow = shallow;
global.SVGElement = Array;

let store = {};

var mockLocalStorage = {
  getItem: function (key) {
    return store[key];
  },
  setItem: function (key, val) {
    store[key] = val;
  },
};

global.localStorage = mockLocalStorage;
// Some environments do not have the SVGElement constructor

let rootContainer;

beforeEach(() => {
  localStorage.setItem(
    "currentAccount",
    JSON.stringify({
      address: "5HMvqPKLDTCZWxDFPqb7hFSzUr4NeMjZSxTJG6AqbLGWz9Zb",
      meta: { name: "wallet test" },
    })
  );
  rootContainer = document.createElement("div");
  document.body.appendChild(rootContainer);
});

afterEach(function () {
  document.body.removeChild(rootContainer);
  rootContainer = null;
});

describe("Testing the inbox", async function () {
  const wrapper = await shallow(<Notes />);
  it("Render properly before the IPFS call", async function () {
    expect(wrapper.find("parent")).to.have.length(0);
    await new Promise((res) =>
      setTimeout(() => {
        res("");
      }, 0)
    );
    wrapper.update();
  });

  // TODO: this won't work in GH actions unless the Axios request to IPFS.io is mocked
  /* it("should render the inbox with at least one note", async function () {
    await wrapper.instance().componentDidMount();

    const notes = wrapper.find(NoteItem);
    expect(notes.length).to.be.above(1);
  }); */
});

describe("Testing settings", function () {
  it("should render properly with expected elements and values", function () {
    const wrapper = shallow(<Settings />);
    const testAcc = {
      address: "5HMvqPKLDTCZWxDFPqb7hFSzUr4NeMjZSxTJG6AqbLGWz9Zb",
      meta: { name: "wallet test" },
    };

    expect(wrapper.find("div")).to.have.length(4);
    expect(wrapper.find("h3")).to.have.length(2);
    expect(wrapper.find(Dropdown)).to.have.length(1);
    expect(wrapper.find(Dropdown).find(Identicon)).to.have.length(1);
    expect(wrapper.find(Dropdown).find(Identicon).props().value).to.equal(
      "5HMvqPKLDTCZWxDFPqb7hFSzUr4NeMjZSxTJG6AqbLGWz9Zb"
    );
    expect(wrapper.find(Dropdown).find(Identicon).props().theme).to.equal(
      "polkadot"
    );
  });
});

const waitForAsync = () => new Promise((resolve) => setImmediate(resolve));

describe("Testing Site Marketplace", function () {
  it("should render properly with expected elements and components", async function () {
    const wrapper = await shallow(<SiteMarketplace />);
    await wrapper.instance().componentDidMount();

    const container = wrapper.find(Container);
    expect(container).to.have.length(1);

    expect(wrapper.state().loading).to.equal(false);
  });
  it("should contain at least one site for sale", async function () {
    const wrapper = await shallow(<SiteMarketplace />);
    await wrapper.instance().componentDidMount();

    const sites = wrapper.find(SiteItem);
    expect(sites.length).to.be.above(1);
  });
});

describe("Testing AllSites Page", function () {
  it("should render properly with expected elements and components", async function () {
    const wrapper = await shallow(<AllSites />);
    await wrapper.instance().componentDidMount();

    const sites = wrapper.find(SiteItemNoSale);
    expect(sites.length).to.be.above(1);

    const container = wrapper.find(Container);
    expect(container).to.have.length(1);
  });
});

describe("Testing MySites Page", function () {
  it("loads at least one site", async function () {
    const wrapper = await shallow(<MySites />);
    await wrapper.instance().componentDidMount();

    expect(wrapper.state().sites.length).to.be.above(1);
  });
});

describe("Testing NotFound Page", function () {
  it("should render properly", function () {
    const wrapper = shallow(<NotFound />);

    const headerText = wrapper.find("h1");
    expect(headerText.text()).to.equal("Page not found!");
  });
});

describe("Testing Upload Page", async function () {
  const wrapper = await mount(<SiteUpload />);

  it("should render a label and a file input field", () => {
    expect(wrapper.find('input[type="file"]')).to.exist;
    expect(wrapper.find("label")).to.exist;
  });

  it("should change the site name with input", () => {
    const nameInput = wrapper.find("#name-input");

    nameInput.simulate("change", {
      target: { name: "siteName", value: "Max" },
    });

    expect(wrapper.state().siteName).to.equal("Max");
  });
});
