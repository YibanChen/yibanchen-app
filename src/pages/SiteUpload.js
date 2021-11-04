import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { Form } from "react-bootstrap";
import TextareaAutosize from "react-autosize-textarea";
import { Progress } from "rsuite";
import { ProgressBar } from "react-bootstrap";
import { ApiPromise } from "@polkadot/api";
import wsProvider from "../util/WsProvider";
import { sendErrorToServer, checkUserBalance } from "../util/Utils";
import { postSite, putSite, deleteSite } from "../util/SitesApi";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import * as Sentry from "@sentry/react";

import "./style.css";

const { Line } = Progress;

class SiteUpload extends Component {
  constructor() {
    super();
    this.maxFileSize = 8000000;
    this.polkadotApi = null;
    this.state = {
      // Initially, no file is selected
      selectedFile: null,
      error: false,
      errorMessage: "",
      siteName: "",
      selectedAccount: "",
      loading: false,
      completed: false,
      percentUploaded: 0,
    };
  }

  // On file select (from the pop up)
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

  // On file upload (click the upload button)
  onFileUpload = async () => {
    // Check Balance
    const userHasEnoughTokens = await checkUserBalance(
      this.state.selectedAccount.address,
      this.polkadotApi
    );
    if (!userHasEnoughTokens) {
      alert("You have insufficient funds to make this transacation.");
      return;
    }

    if (!this.state.siteName) {
      alert("Please make sure to enter the domain of your site");

      return;
    }

    this.setState({ loading: true });
    if (this.state.selectedFile.type === "application/zip") {
      this.pinFile("Zip");
    }

    if (this.state.selectedFile.type === "text/html") {
      this.pinFile("Html");
    }
  };

  confirmSiteUpload = async (name, index, uuid) => {
    const data = {};
    data["siteIndex"] = index;
    await putSite(uuid, data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        this.setState({
          error: true,
          errorMessage: "error pinning file to IPFS. Please try again later",
          loading: false,
        });
        console.log(err);
      });
  };

  removeSite = async (uuid, IpfsHash) => {
    const data = {};
    data["siteUuid"] = uuid;
    await deleteSite(uuid, data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        this.setState({
          error: true,
          errorMessage: "error pinning file to IPFS. Please try again later",
          loading: false,
        });
        console.log(err);
      });
  };

  writeSiteHashToBlockChain = async (hash, uuid) => {
    await web3Enable("YibanChen");
    await web3Accounts();
    const account = this.state.selectedAccount;
    const injector = await web3FromSource(account.meta.source);

    this.setState({ percentUploaded: 60 });

    try {
      // Put the note hash on the blockchain
      let txHash = await this.polkadotApi.tx.site
        .create(hash, this.state.siteName)
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ events = [], status }) => {
            console.log("Transaction status:", status.type);

            if (status.isInBlock) {
              events.forEach(({ event: { data, method, section }, phase }) => {
                const siteI = Number(data[1]);

                if (!isNaN(siteI)) {
                  this.confirmSiteUpload(this.state.siteName, siteI, uuid);
                }
              });
            } else if (status.isFinalized) {
              this.setState({ percentUploaded: 95 });
              console.log("Finalized block hash", status.asFinalized.toHex());
              console.log(`txHash ${txHash}`);
              this.setState({ loading: false, completed: true });
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
      this.removeSite(uuid, hash);
      sendErrorToServer(err);
      Sentry.captureException(err);
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

    console.log("PRE CALL");

    await postSite(fileData)
      .then((res) => {
        siteData = res;

        this.setState({ percentUploaded: 40 });

        this.writeSiteHashToBlockChain(siteData.IpfsHash, siteData.uuid);
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

  async componentDidMount() {
    if (!!!localStorage.getItem("currentAccount")) {
      console.log("REDIRECTING TO ABOUT FROM SITEUPLOAD");
      this.props.history.push("/about");
      return;
    }
    if (!!localStorage.getItem("currentAccount")) {
      this.setState({
        selectedAccount: JSON.parse(localStorage.getItem("currentAccount")),
      });
    } else if (
      !!!JSON.parse(localStorage.getItem("currentAccount")) &&
      process.env.NODE_ENV !== "test"
    ) {
      this.props.history.push("/");
      return;
    }

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
  }

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

  // File content to be displayed after
  // file upload is complete
  fileData = () => {
    if (this.state.selectedFile) {
      return (
        <div className="white-text">
          <h2>File Details</h2>

          <p>File Name: {this.state.selectedFile.name}</p>

          <p>File Type: {this.state.selectedFile.type}</p>

          <p>Size: {(this.state.selectedFile.size * 1.25e-7).toFixed(3)} MB</p>
        </div>
      );
    } else {
      return <div className="white-text"></div>;
    }
  };

  goBack = () => {
    this.setState({
      selectedFile: null,
      error: false,
      errorMessage: "",
      siteName: "",
      loading: false,
      completed: false,
    });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="text-center">
          <h1 className="centered">There was a problem uploading your site</h1>
          <p className="centered">{this.state.errorMessage}</p>
          <Button
            variant="secondary"
            className="btn-primary btn-lg m-2 "
            onClick={this.goBack}
          >
            Back
          </Button>
        </div>
      );
    }
    if (this.state.completed) {
      return (
        <div className="centered">
          <h1 className="m-4">Site upload completed!</h1>
        </div>
      );
    }
    if (this.state.loading) {
      return (
        <div className="progress-container">
          <h1 className="m-3 white-text text-center">Uploading your site</h1>

          <div className="progress-child">
            <ProgressBar animated now={this.state.percentUploaded} />
          </div>
        </div>
      );
    } else {
      return (
        <div className="white-text site-parent text-center">
          <h1 className="m-2">Upload new Site</h1>
          <a
            className="mb-5"
            style={{ color: "#F19135" }}
            href={`https://docs.yibanchen.com/#uploading-a-site`}
          >
            First time uploading? Click here to learn how to upload your Site.
          </a>
          <div className="centered mt-5">
            <label style={{ fontSize: "1.5em" }}>Site Name</label>
            <input
              className="smallInput"
              type="text"
              id="name-input"
              onChange={(e) => this.setState({ siteName: e.target.value })}
              defaultValue={this.state.siteName}
              rows={1}
              cols={51}
              spellCheck="false"
              placeholder="Enter the name of your Site"
            ></input>

            <Form.File
              className="mt-4 mb-4 marg-left"
              type="file"
              name="siteFile"
              onChange={this.onFileChange}
              accept=".html, .zip"
            />

            {this.fileData()}
          </div>
          {this.fileUploadButton()}
        </div>
      );
    }
  }
}

export default SiteUpload;
