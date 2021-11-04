import * as React from "react";
import { Redirect } from "react-router-dom";
import { ApiPromise } from "@polkadot/api";
import { web3Enable, web3FromSource } from "@polkadot/extension-dapp";
import { checkUserBalance } from "../util/Utils";
import { Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import Loader from "react-loader-spinner";
import wsProvider from "../util/WsProvider";
import SiteItem from "../components/SiteItem";

import YibanLoader from "../components/YibanLoader";
import "./style.css";

// SiteMarketplace React Component

class SiteMarketplace extends React.Component {
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
    const allSitePrices = await api.query.site.sitePrices.entries();

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

    allSitePrices.forEach(
      ([
        {
          args: [indexObj],
        },
        price,
      ]) => {
        const index = indexObj.words[0];

        // add price to all sites

        var result = sites.filter((obj) => {
          return obj.site_index === parseInt(index);
        })[0];

        for (let [i, s] of sites.entries()) {
          if (s === result) {
            s["humanPrice"] = price.toHuman();
            s["realPrice"] = price.toJSON();

            break;
          }
        }
      }
    );

    let i = sites.length;

    while (i--) {
      let site = sites[i];

      if (site["realPrice"] === undefined || site["realPrice"] === 0) {
        sites.splice(i, 1);
      }
    }

    const PERGROUP = 4;

    var sitesBrokenIntoChunks = sites.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / PERGROUP);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);

    this.setState({
      sites: sites,
      sitesBrokenIntoChunks: sitesBrokenIntoChunks,
    });
  };

  componentDidMount = async () => {
    if (!!!localStorage.getItem("currentAccount")) {
      return;
    }
    await this.fetchData();

    this.setState({ loading: false });
  };

  buySite = async (site) => {
    // Balance Check
    const userHasEnoughTokens = await checkUserBalance(
      this.state.selectedAccount.address,
      this.polkadotApi
    );

    if (!userHasEnoughTokens) {
      alert("You have insufficient funds to make this transacation.");
      return;
    }

    // check if already owned
    if (site.owner === this.state.selectedAccount.address) {
      alert("You already own this site!");
      return;
    }

    // Do blockchain transaction
    this.setState({ processingTransacation: true });
    const account = this.state.selectedAccount;
    await web3Enable("YibanChen");
    const injector = await web3FromSource(account.meta.source);

    try {
      let txs = [];
      const purchase = await this.polkadotApi.tx.site
        .buy(site.owner, site.site_index, site.realPrice)
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ events = [], status }) => {
            if (status.isInBlock) {
              events.forEach(
                ({ event: { data, method, section }, phase }) => {}
              );
            } else if (status.isFinalized) {
              let newSites = this.state.sites;
              let indexInList = newSites.findIndex(
                (obj) => obj.site_index === site.site_index
              );

              alert(`Transacation successful! You now own ${site.site_name}`);
              newSites[indexInList].owner = account.address;
              this.setState({ sites: newSites });
              this.setState({ processingTransacation: false });
            }
          }
        );
    } catch (err) {
      if (err.message !== "Cancelled") {
        alert("Unable to process transacation. ");
      }
      console.log("error buying site:", err);
      this.setState({ processingTransacation: false });
    }
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

    const newSites = this.state.sites.filter((site) =>
      site.site_name.toLowerCase().includes(term)
    );
    const newChunks = this.breakIntoChunks(newSites);
    this.setState({ sitesBrokenIntoChunks: newChunks });
  }

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
            className=" search-input"
            placeholder="Search Sites"
            onChange={(e) => this.searchSites(e.target.value)}
          ></input>
        </div>

        <div className="white-text all-site-list">
          <Container fluid>
            <h1 className="mt-4 mb-3 centered">Site Marketplace</h1>
            <h5 className=" mb-4 grey-text centered">
              Buy and Sell YibanChen Sites
            </h5>

            {this.state.sitesBrokenIntoChunks.length ? (
              this.state.sitesBrokenIntoChunks.map((siteRow, i) => (
                <Row md={4} key={i} className="add-space">
                  {siteRow[0] ? (
                    <SiteItem
                      address={this.state.selectedAccount.address}
                      site={siteRow[0]}
                      buySiteFunc={this.buySite}
                    />
                  ) : (
                    ""
                  )}
                  {siteRow[1] ? (
                    <SiteItem
                      address={this.state.selectedAccount.address}
                      site={siteRow[1]}
                      buySiteFunc={this.buySite}
                    />
                  ) : (
                    ""
                  )}
                  {siteRow[2] ? (
                    <SiteItem
                      address={this.state.selectedAccount.address}
                      site={siteRow[2]}
                      buySiteFunc={this.buySite}
                    />
                  ) : (
                    ""
                  )}
                  {siteRow[3] ? (
                    <SiteItem
                      site={siteRow[3]}
                      buySiteFunc={this.buySite}
                      address={this.state.selectedAccount.address}
                    />
                  ) : (
                    ""
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

export default SiteMarketplace;
