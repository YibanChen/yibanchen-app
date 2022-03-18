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
            address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
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

describe("Testing Site Marketplace", function () {
    it("should render properly with expected elements and components", async function () {
        const wrapper = await shallow(<SiteMarketplace />);
        await wrapper.instance().componentDidMount();

        const container = wrapper.find(Container);
        expect(container).to.have.length(1);

        expect(wrapper.state('loading')).to.equal(false);

    });
});

describe("Testing AllSites Page", function () {
    it("should render properly with expected elements and components", async function () {
        const wrapper = await shallow(<AllSites />);
        await wrapper.instance().componentDidMount();

        const container = wrapper.find(Container);
        expect(container).to.have.length(1);
    });
});

describe("Testing MySites Page", function () {
    it("loads at least one site", async function () {
        const wrapper = await shallow(<MySites />);
        await wrapper.instance().componentDidMount();

        expect(wrapper.state('sites').length).to.equal(0);
    });
});

describe("Testing NotFound Page", function () {
    it("should render properly", function () {
        const wrapper = shallow(<NotFound />);

        const headerText = wrapper.find("h1");
        expect(headerText.text()).to.equal("Page not found!");
    });
});

describe("Testing Upload Page", function () {
    const wrapper = mount(<SiteUpload />);

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

describe("Testing settings", function () {
    it("should render properly with expected elements and values", function () {
        const wrapper = shallow(<Settings />);
        const testAcc = {
            address: "5FyNFTsWZ8mZpR83rED6gc1gQD85jKbsR7d4SV5aiNAPvMGH",
            meta: { name: "wallet test" },
        };

        expect(wrapper.find("div")).to.have.length(10);
        expect(wrapper.find("h3")).to.have.length(2);
        expect(wrapper.find(Dropdown)).to.have.length(1);
        expect(wrapper.find(Dropdown).find(Identicon).length).to.be.above(0);

        expect(wrapper.find(Dropdown).find(Identicon).props().theme).to.equal(
            "polkadot"
        );
    });
});

//Name service test
const setUp = (props) => shallow(<Settings {...props} />);
describe("Testing Name service", function () {
    let component;
    let instance;
    beforeEach(() => {
        component = setUp();
    })
    it("should render properly with expected elements", function () {
        const wrapper = component.find(".name-service");
        expect(wrapper).to.have.length(1);
        expect(wrapper.find("div")).to.have.length(6);
        expect(wrapper.find("input")).to.have.length(1);
        expect(wrapper.find("button")).to.have.length(2);
    })

    describe("Input handler", function () {
        it("should handle name input", function () {
            const wrapper = component.find(".name-service");
            wrapper.find("input").simulate('change', {
                target: {
                    value: 'testName'
                }
            })
            expect(wrapper.find("input").prop("defaultValue")).to.equal(
                ''
            )
        })
        it("should set name click", function () {
            const wrapper = component.find(".name-service");
            wrapper.find(".btn_set").simulate('click');
            expect(wrapper.find(".account-name-validate").text()).to.equal('This name is currently not available. Please choose another.');
            expect(wrapper.find(".btn_set").text()).to.equal('Set Name');
        })
        it("should clear name click", function () {
            const wrapper = component.find(".name-service");
            wrapper.find(".btn-clear").simulate('click');
            expect(wrapper.find(".btn-clear").text()).to.equal('Clear Name');
        })


    });

});

describe("Name value", function () {
    it("should have no name value without message props", function () {
        const wrapper = shallow(<NoteDetails />);
        expect(wrapper.state().accountNameValue).to.equal("")
    })


});

// const waitForAsync = () => new Promise((resolve) => setImmediate(resolve));

