import * as React from "react";
import { Redirect } from "react-router-dom";
import { ApiPromise } from "@polkadot/api";

import { Container, Row } from "react-bootstrap";
import { Modal, Button } from "react-bootstrap";

import wsProvider from "../util/WsProvider";
import SiteItemNoSale from "../components/SiteItemNoSale";
import SiteItemEmpty from "../components/SiteItemEmpty";
import YibanLoader from "../components/YibanLoader";

import "./style.css";
// All Sites React Component

class AllSites extends React.Component {
  constructor() {
    super();
    this.polkadotApi = null;

    this.state = {
      sites: [],
      sitesBrokenIntoChunks: [],
      loading: true,
      error: false,
      errorMessage: "",
      selectedAccount: { address: "" },
      processingTransacation: false,
      searchTerm: "",
    };
  }

  fetchData = async () => {
    const account = JSON.parse(localStorage.getItem("currentAccount"));
    this.setState({ selectedAccount: account, loading: true });
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

    const allSites = await api.query.site.sites.entries();

    let sites = [];

    for (const entry of allSites) {
      const site = entry[0].toHuman();
      const siteData = {
        owner: site[0],
        siteId: parseInt(site[1]),
        site_index: parseInt(site[1]),
        ipfs_cid: entry[1]["value"].ipfs_cid.toString(),
        site_name: entry[1]["value"].site_name.toString(),
      };

      sites.push(siteData);
    }

    let i = sites.length;

    const PERGROUP = 4;

    var sitesBrokenIntoChunks = this.breakIntoChunks(sites);
    this.setState({
      sites: sites,
      sitesBrokenIntoChunks: sitesBrokenIntoChunks,
      sitesToDisplay: sites,
    });
  };

  breakIntoChunks = (sites) => {
    const PERGROUP = 4;
    let sitesBrokenIntoChunks = sites.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / PERGROUP);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);

    return sitesBrokenIntoChunks;
  };

  searchSites(searchTerm) {
    this.setState({ searchTerm: searchTerm });
    this.filterSites(searchTerm);
  }

  filterSites(searchTerm) {
    const term = searchTerm.toLowerCase();

    const newSites = this.state.sites.filter(
      (site) =>
        site.site_name.toLowerCase().includes(term) ||
        site.owner.toLowerCase().includes(term)
    );
    const newChunks = this.breakIntoChunks(newSites);
    this.setState({ sitesBrokenIntoChunks: newChunks });
  }

  componentDidMount = async () => {
    if (!!!localStorage.getItem("currentAccount")) {
      return;
    }
    await this.fetchData();

    this.setState({ loading: false });
  };

  render() {
    if (!!!localStorage.getItem("currentAccount")) {
      return <Redirect to="/about"></Redirect>;
    }
    if (this.state.loading) {
      return (
        <div className="centered m-4 p-1">
          <YibanLoader type="Puff" color="#02C3FC" height={200} width={200} />
          <h1 className="m-4 text-center">Loading Sites</h1>
        </div>
      );
    }
    if (this.state.processingTransacation) {
      return (
        <div className="centered m-4 p-1">
          <YibanLoader type="Puff" color="#02C3FC" height={200} width={200} />
          <h1 className="m-4 text-center">Processing Transacation...</h1>
        </div>
      );
    }

    return (
      <div>
        <div className=" search-spot">
          <input
            className="mt-2 search-input"
            placeholder="Search Sites"
            onChange={(e) => this.searchSites(e.target.value)}
          ></input>
        </div>
        <div className="white-text all-site-list">
          <Container fluid className="white-text">
            <h1 className="mt-4 mb-3 centered">All YC Sites</h1>
            <h5 className=" mb-4 grey-text centered">
              Browse user-uploaded YibanChen Sites
            </h5>
            {this.state.sitesBrokenIntoChunks.length ? (
              this.state.sitesBrokenIntoChunks.map((siteRow, i) => (
                <Row
                  md={4}
                  key={i}
                  className="add-space"
                  // style={{ marginLeft: "10%", marginRight: "10%" }}
                >
                  {siteRow[0] ? (
                    <SiteItemNoSale
                      address={this.state.selectedAccount.address}
                      site={siteRow[0]}
                      polkadotApi={this.polkadotApi}
                    />
                  ) : (
                    <SiteItemEmpty />
                  )}
                  {siteRow[1] ? (
                    <SiteItemNoSale
                      address={this.state.selectedAccount.address}
                      site={siteRow[1]}
                      polkadotApi={this.polkadotApi}
                    />
                  ) : (
                    <SiteItemEmpty />
                  )}
                  {siteRow[2] ? (
                    <SiteItemNoSale
                      address={this.state.selectedAccount.address}
                      site={siteRow[2]}
                      polkadotApi={this.polkadotApi}
                    />
                  ) : (
                    <SiteItemEmpty />
                  )}
                  {siteRow[3] ? (
                    <SiteItemNoSale
                      site={siteRow[3]}
                      address={this.state.selectedAccount.address}
                      polkadotApi={this.polkadotApi}
                    />
                  ) : (
                    <SiteItemEmpty />
                  )}
                </Row>
              ))
            ) : (
              <h5 className="centered"> No Sites found! </h5>
            )}
          </Container>
        </div>
      </div>
    );
  }
}

export default AllSites;
