import * as React from "react";
import {
  web3Enable,
  web3Accounts,
  web3FromSource,
} from "@polkadot/extension-dapp";
import { Card, Dropdown, DropdownButton, Form } from "react-bootstrap";
import { putSiteFromIndex, deleteSiteFromIndex } from "../util/SitesApi";
import Button from "react-bootstrap/Button";
import { Modal } from "react-bootstrap";
import Loader from "react-loader-spinner";
import YibanLoader from "./YibanLoader";
import "../pages/style.css";

class MySiteItem extends React.Component {
  state = {
    site: this.props.site,
    selectedAccount: this.props.account,
    showModifyModal: false,
    selectedFile: null,
    uploadingSite: false,
    loading: true,
  };

  hideSpinner = () => {
    console.log("DONE SPINNING!");
    this.setState({
      loading: false,
    });
  };

  changeDesiredPrice = (price) => {
    this.setState((prevState) => {
      let site = Object.assign({}, prevState.site); // creating copy of state variable site
      site.desiredPrice = parseFloat(price); // update the price property, assign a new value
      return { site }; // return new site object
    });
  };

  modifySite = async (site) => {
    console.log(site);
    this.setState({ showModifyModal: true });
  };

  deleteSite = async (site) => {
    const continueWithDeletion = window.confirm(
      `Are you sure you want to delete ${site.site_name}? You cannot undo this action.`
    );
    if (!continueWithDeletion) {
      return;
    }
    try {
      const account = this.state.selectedAccount;
      await web3Enable("YibanChen");
      const injector = await web3FromSource(account.meta.source);
      await this.props.polkadotApi.tx.site
        .burn(site.site_index)
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ events = [], status }) => {
            if (status.isInBlock) {
              events.forEach(
                ({ event: { data, method, section }, phase }) => {}
              );
            } else if (status.isFinalized) {
              console.log("Finalized block hash", status.asFinalized.toHex());
            }
          }
        );
      deleteSiteFromIndex(site.site_index, { IpfsHash: site.ipfs_cid });
      this.props.rerenderParentCallback(site, this.props.i);
    } catch (err) {
      console.log(err);
    }
  };

  preventMinus = (e) => {
    if (e.code === "Minus") {
      e.preventDefault();
    }
  };

  setPrice = async (site) => {
    const account = this.state.selectedAccount;

    await web3Enable("YibanChen");
    const injector = await web3FromSource(account.meta.source);

    try {
      site["changing"] = true;

      this.setState({ site: site });

      await this.props.polkadotApi.tx.site
        .listing(
          site.site_index,
          1e12 * parseFloat(this.state.site["desiredPrice"])
        )
        .signAndSend(
          account.address,
          { signer: injector.signer },
          async ({ events = [], status }) => {
            if (status.isInBlock) {
              events.forEach(
                ({ event: { data, method, section }, phase }) => {}
              );
            } else if (status.isFinalized) {
              const priceObject =
                await this.props.polkadotApi.query.site.sitePrices(
                  site.site_index
                );

              site["realPrice"] = priceObject.toJSON();
              site["humanPrice"] = priceObject.toHuman();
              site["changing"] = false;
              this.setState({ site: site });
            }
          }
        );
    } catch (err) {
      console.log("ERROR");
      console.log(err);
      site["changing"] = false;
      this.setState({ site: site });
    }
  };

  onFileChange = (event) => {
    if (false) {
      alert("File is too big! Limit 1 MB");
      event.target.value = null;

      return;
    } else {
      // Update the state
      this.setState({ selectedFile: event.target.files[0] });
    }
  };

  writeSiteHashToBlockChain = async (hash) => {
    await web3Enable("YibanChen");
    await web3Accounts();
    const account = this.state.selectedAccount;
    const injector = await web3FromSource(account.meta.source);

    this.setState({ percentUploaded: 60 });

    try {
      // Put the note hash on the blockchain

      let txHash = await this.props.polkadotApi.tx.site
        .modify(hash, this.state.site.site_name, this.state.site.site_index)
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ events = [], status }) => {
            console.log("Transaction status:", status.type);

            if (status.isInBlock) {
              events.forEach(
                ({ event: { data, method, section }, phase }) => {}
              );
            } else if (status.isFinalized) {
              this.setState({ percentUploaded: 95 });

              this.setState({ loading: false, completed: true });
              window.location.reload(false);
            }
          }
        );
    } catch (err) {
      console.log("err:", err);
      this.setState({
        error: true,
        errorMessage: err.message,
        loading: false,
      });
    }
  };

  pinFile = async (fileType) => {
    this.setState({ percentUploaded: 25 });
    console.log("PINNING");
    const fileData = new FormData();
    fileData.append("siteFile", this.state.selectedFile);
    fileData.append("siteName", this.state.siteName);
    fileData.append("walletAddress", this.state.selectedAccount.address);
    fileData.append("fileType", fileType);

    let siteData;

    await putSiteFromIndex(this.state.site.site_index, fileData)
      .then((res) => {
        siteData = res;

        this.setState({ percentUploaded: 40 });

        this.writeSiteHashToBlockChain(siteData.IpfsHash);
      })
      .catch((err) => {
        this.setState({
          error: true,
          errorMessage: "error pinning file to IPFS. Please try again later",
          loading: false,
        });
        console.log(err);
      });
    console.log("POST CALL");
  };

  onFileUpload = async () => {
    console.log(
      "selectedfile: ",
      this.state.selectedFile,
      this.state.selectedFile.type
    );
    this.setState({ uploadingSite: true });
    if (this.state.selectedFile.type === "application/zip") {
      this.pinFile("Zip");
    }

    if (this.state.selectedFile.type === "text/html") {
      this.pinFile("Html");
    }
  };

  fileUploadButton = () => {
    if (this.state.selectedFile === null) {
      return <div></div>;
    } else {
      return (
        <div>
          <Button onClick={this.onFileUpload}>Upload!</Button>
        </div>
      );
    }
  };

  handleClose = () => {
    this.setState({ showModifyModal: false });
  };

  render() {
    return (
      <Card
        className="back-dark white-text mb-4 text-center"
        key={this.props.i}
      >
        <Modal
          className="white-text my-modal"
          show={this.state.showModifyModal}
          onHide={this.handleClose}
        >
          {this.state.uploadingSite ? (
            <div className="centered">
              <YibanLoader
                styleName="m-1"
                type="Puff"
                color="#02C3FC"
                height={100}
                width={100}
              />{" "}
            </div>
          ) : (
            <div>
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
              <Modal.Footer>{this.fileUploadButton()}</Modal.Footer>
            </div>
          )}
        </Modal>
        <Card.Body>
          <Card.Title style={{ fontWeight: "bold" }}>
            <a
              style={{ color: "#02C5FE", textDecoration: "underline" }}
              href={`https://ipfs.io/ipfs/${this.state.site.ipfs_cid}`}
            >
              {this.state.site.site_name}
            </a>
          </Card.Title>

          <h5>
            {this.state.site.changing ? (
              <YibanLoader type="Puff" color="#04A902" height={20} width={20} />
            ) : this.state.site.realPrice && this.state.site.realPrice !== 0 ? (
              `Price: ${this.state.site.humanPrice} `
            ) : (
              `Not for Sale`
            )}{" "}
          </h5>
          <div className="topleftcorner wrap mt-2 mb-2">
            {this.state.loading ? (
              <YibanLoader
                styleName="iframe-loader"
                type="Puff"
                color="#02C3FC"
                height={100}
                width={100}
              />
            ) : null}
            <iframe
              id="mysite-iframe"
              title="mysite-iframe"
              width="250"
              height="175"
              className=" frame  mr-1"
              onLoad={this.hideSpinner}
              src={`https://ipfs.io/ipfs/${this.state.site.ipfs_cid}`}
            ></iframe>
          </div>

          <div className="button-container">
            <div className="mt-1">
              <input
                min="0"
                type="number"
                className="verySmallInput mt-1"
                placeholder={this.state.site.realPrice / 1e12}
                spellCheck="false"
                defaultValue={this.state.site.price}
                onKeyPress={(e) => {
                  if (e.code === "Minus") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  this.changeDesiredPrice(e.target.value);
                }}
              ></input>

              <Button
                style={{
                  color: "#eeeeee",
                  boxShadow: "0 -2px 10px rgba(0, 0, 0, 1)",
                  backgroundColor: "#F19135",
                  border: "none",
                }}
                className="btn-md mt-2"
                aria-label="setPrice"
                onClick={() => this.setPrice(this.state.site)}
              >
                Set New Price
              </Button>
            </div>

            <div className="toprightcorner">
              <Dropdown>
                <Dropdown.Toggle
                  id={this.props.site.site_name + "-dropdown"}
                  variant="secondary"
                >
                  Site Options
                </Dropdown.Toggle>

                <Dropdown.Menu variant="dark">
                  <Dropdown.Item
                    href={`https://ipfs.io/ipfs/${this.state.site.ipfs_cid}`}
                  >
                    <div className="white-text">Visit</div>
                  </Dropdown.Item>

                  <Dropdown.Item
                    onClick={() => this.modifySite(this.state.site)}
                    id={this.props.site.site_name + "-modify"}
                  >
                    <div className="white-text">Modify</div>
                  </Dropdown.Item>

                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={() => this.deleteSite(this.state.site)}
                    id={this.props.site.site_name + "-delete"}
                  >
                    <div className="red-text">Delete</div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }
}

export default MySiteItem;
