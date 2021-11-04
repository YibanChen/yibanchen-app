import * as React from "react";
import { Redirect } from "react-router-dom";
import { ApiPromise } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import { Card, ListGroup, Dropdown, Form } from "react-bootstrap";
import { deleteSiteFromIndex } from "../util/SitesApi";
import MySiteItem from "../components/MySiteItem";
import Button from "react-bootstrap/Button";
import { Modal } from "react-bootstrap";
import YibanLoader from "../components/YibanLoader";
import wsProvider from "../util/WsProvider";

import "./style.css";
// MySites React Component

class MySites extends React.Component {
  constructor() {
    super();
    this.polkadotApi = null;
    this.rerenderParentCallback = this.rerenderParentCallback.bind(this);

    this.state = {
      sites: [],
      displaySites: [],
      loading: true,
      error: false,
      errorMessage: "",
      selectedAccount: {},
      priceChangeError: false,
      showModifyModal: false,
      searchTerm: "",
    };
  }

  rerenderParentCallback(site, i) {
    let newSites = this.state.sites;
    newSites.splice(i, 1);
    this.setState({ sites: newSites });
  }

  getSiteData = async () => {
    const account = JSON.parse(localStorage.getItem("currentAccount"));
    this.setState({ selectedAccount: account });
    const api = await ApiPromise.create({
      // Create an API instance
      provider: wsProvider,
      types: {
        ClassId: "u32",
        ClassIdOf: "ClassId",
        TokenId: "u64",
        TokenIdOf: "TokenId",
        TokenInfoOf: {
          metadata: "CID",
          owner: "AccountId",
          data: "TokenData",
        },
        SiteIndex: "u32",
        Site: {
          ipfs_cid: "Text",
          site_name: "Text",
        },
        ClassInfoOf: {
          metadata: "string",
          totalIssuance: "string",
          owner: "string",
          data: "string",
        },
        Note: "Text",
        NoteIndex: "u32",
      },
    });
    this.polkadotApi = api;

    if (!!localStorage.getItem("currentAccount")) {
      this.setState({
        selectedAccount: JSON.parse(localStorage.getItem("currentAccount")),
      });
    }

    const allEntries = await this.polkadotApi.query.site.sites.entries(
      account.address
    );

    let loadedSites = [];
    for (const entry of allEntries) {
      const site = entry[0].toHuman();

      loadedSites.push({
        owner: site[0],
        siteId: parseInt(site[1]),
        site_index: parseInt(site[1]),
        ipfs_cid: entry[1]["value"].ipfs_cid.toString(),
        site_name: entry[1]["value"].site_name.toString(),
        changing: false,
      });
    }
    /* allEntries.forEach(
      ([
        {
          args: [acc, index],
        },
        site,
      ]) => {

        loadedSites.push({ site: site.toHuman(), siteId: index });
      }
    ); */

    let newSites = this.state.sites;
    for (const site of loadedSites) {
      let newSites = this.state.sites;

      const priceObject = await this.polkadotApi.query.site.sitePrices(
        site.site_index
      );

      site["realPrice"] = priceObject.toJSON();
      site["humanPrice"] = priceObject.toHuman();

      newSites.push(site);
    }

    this.setState({ sites: newSites, displaySites: newSites });
  };

  componentDidMount = async () => {
    if (!!!localStorage.getItem("currentAccount")) {
      return;
    }
    await this.getSiteData();
    for (const site of this.state.sites) {
      site["desiredPrice"] = 0;
    }
    this.setState({ loading: false });
  };

  modifySite = async (site) => {
    this.setState({ showModifyModal: true });
  };

  siteList = () => {
    for (const s of this.state.displaySites) {
    }
    if (this.state.loading) {
      return (
        <div className="centered m-4 p-1">
          <YibanLoader type="Puff" color="#02C3FC" height={200} width={200} />
          <h1 className="m-4 text-center">Loading Sites</h1>
        </div>
      );
    }
    if (this.state.displaySites.length === 0) {
      return (
        <div>
          <div className="searchbar-div centered mb-4 mt-2 pb-1">
            <h4>Search Sites</h4>
            <input
              className="smallInput"
              defaultValue={this.state.searchTerm}
              onChange={(e) => this.searchSites(e.target.value)}
            ></input>
          </div>
          <h4 className="white-text centered">
            {this.state.searchTerm
              ? "No sites found"
              : "You haven't uploaded any sites yet"}
          </h4>
        </div>
      );
    }

    return (
      <div className="site-list">
        <div className="searchbar-div centered mb-4 mt-2 pb-1">
          <div className="align-left">
            <h1 className="white-text m-4 ">My Sites</h1>
          </div>
          <h4>Search</h4>
          <input
            className="smallInput"
            placeholder="Search..."
            defaultValue={this.state.searchTerm}
            onChange={(e) => this.searchSites(e.target.value)}
          ></input>
        </div>
        <div className="">
          <ListGroup>
            {this.state.displaySites.map((site, i) => (
              <MySiteItem
                rerenderParentCallback={this.rerenderParentCallback}
                site={site}
                account={this.state.selectedAccount}
                i={i}
                key={site.site_name}
                polkadotApi={this.polkadotApi}
                id={site.site_name}
              />
            ))}
          </ListGroup>
        </div>
      </div>
    );
  };

  handleClose = () => {
    this.setState({ showModifyModal: false });
  };
  handleShow = () => this.setState({ showModifyModal: true });

  searchSites(searchTerm) {
    console.log(searchTerm);
    this.setState({ searchTerm: searchTerm });
    this.filterSites(searchTerm);
  }

  filterSites(searchTerm) {
    const term = searchTerm.toLowerCase();
    console.log(`term: ${term}`);

    const newSites = this.state.sites.filter((site) =>
      site.site_name.toLowerCase().includes(term)
    );

    for (const s of newSites) {
      console.log(`s: ${s.site_name}`);
    }

    this.setState({ displaySites: newSites });
    console.log("state: ", this.state.displaySites);
  }

  render() {
    if (!!!localStorage.getItem("currentAccount")) {
      console.log("REDIRECTING TO ABOUT");
      return <Redirect to="/about"></Redirect>;
    }
    return (
      <div id="site-div">
        <Modal
          show={this.state.showModifyModal}
          onHide={this.handleClose}
          shouldCloseOnOverlayClick={true}
        >
          <Modal.Header closeButton>
            <Modal.Title>Modify Site</Modal.Title>
          </Modal.Header>
          <div>
            <Form.File
              className="mt-4 mb-4 marg-left"
              type="file"
              name="siteFile"
              onChange={this.onFileChange}
              accept=".html, .zip"
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.handleClose()}>
              Close
            </Button>
            <Button variant="primary" onClick={this.handleClose}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {this.siteList()}
      </div>
    );
  }
}

export default MySites;
