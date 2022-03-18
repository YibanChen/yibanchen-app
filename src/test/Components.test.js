import React from "react";

import { expect } from "chai";
import { configure, mount, shallow } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";

import SiteItem from "../components/SiteItem";
import MySiteItem from "../components/MySiteItem";
import SiteItemEmpty from "../components/SiteItemEmpty";
import SiteItemNoSale from "../components/SiteItemNoSale";
import AccountListItem from "../components/AccountListItem";
import NoteDetails from "../components/NoteDetails";

import Descriptor from "../components/Descriptor";

import ComposeScreen from "../pages/Compose";
import Identicon from "@polkadot/react-identicon";
import { Button } from "react-bootstrap";
configure({ adapter: new Adapter() });

describe("Testing NoteDetails component", function () {
  it("should contain the expected props", async function () {
    const mes = {
      message: "hi",
      timestamp: "8:00 pm",
      timestamp_for_sort: "3",
      time_distance: "3",
      noteId: 3,
      sender: { address: "AbC123" },
      subject: "a subject about something",
    };
    const wrapper = mount(<NoteDetails messageToFocus={mes}></NoteDetails>);

    expect(wrapper.props().messageToFocus.sender.address).to.equal("AbC123");
  });
});

describe("Testing SiteItem component", function () {
  const testSite = {
    site_name: "test_site",
    ipfs_cid: "hash",
    site_index: 8,
    owner: "abc123",
    humanPrice: "100 units",
  };
  const buyFunc = () => console.log("test");
  const address = "123abc";

  it("should contain the expected props", async function () {
    // global.address = "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH";

    const wrapper = mount(
      <SiteItem site={testSite} buySiteFunc={buyFunc} address={address} />
    );
    expect(wrapper.find(Identicon)).to.have.lengthOf(1);
    expect(wrapper.find(Button)).to.have.lengthOf(1);
    expect(wrapper.find("p")).to.have.lengthOf(1);
    const identicon = wrapper.find(Identicon);

    expect(identicon.props().value).to.equal("abc123");
  });
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
global.localStorage = mockLocalStorage;

beforeEach(() => {
  localStorage.setItem(
    "currentAccount",
    JSON.stringify({
      address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
      meta: { name: "max test" },
    })
  );
});

describe("Testing MySiteItem component", function () {
  const testSite = {
    site_name: "test_site",
    ipfs_cid: "hash",
    site_index: 8,
    owner: "abc123",
    humanPrice: "100 units",
  };

  const testAcc = {
    address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
    meta: { name: "max test" },
  };

  it("should have the expected props, struture, and state", function () {
    const wrapper = shallow(
      <MySiteItem site={testSite} account={testAcc} i={8} key={8} />
    );

    expect(wrapper.find(Button)).to.have.lengthOf(1);
    expect(wrapper.state().site).to.equal(testSite);
    expect(wrapper.state().selectedAccount).to.equal(testAcc);
  });
});

describe("Testing SiteItemNoSale component", function () {
  const testSite = {
    site_name: "test_site",
    ipfs_cid: "hash",
    site_index: 8,
    owner: "abc123",
    humanPrice: "100 units",
  };
  const address = "123abc";

  it("should contain the expected props", async function () {
    const wrapper = mount(<SiteItemNoSale address={address} site={testSite} />);

    expect(wrapper.find("p")).to.have.lengthOf(1);
  });
});

describe("Testing SiteItemEmpty component", function () {
  it("Should be empty", async function () {
    const wrapper = mount(<SiteItemEmpty />);
    expect(wrapper.props()).to.deep.equal({});
  });
});

describe("Testing Descriptor component", function () {
  it("should have the expected props, struture, and state", function () {
    const wrapper = mount(
      <Descriptor address={"theOwner"} identiconSize={50} />
    );

    const identicon = wrapper.find(Identicon);

    expect(identicon.props().size).to.equal(50);
    expect(identicon.props().value).to.equal("theOwner");
  });
});
describe("Testing Account List Item component", function () {
  it("should contain the expected props", function () {
    // global.address = "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH";
    const testAcc = {
      address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
      meta: { name: "max test" },
    };
    const wrapper = shallow(<AccountListItem account={testAcc} />);

    expect(wrapper.props().children.props.children[0].props.value).to.equal(
      "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH"
    );
    expect(wrapper.props().children.props.children[2]).to.equal("max test");
  });
});
