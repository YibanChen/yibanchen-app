import React, { Component } from "react";
import { ApiPromise } from "@polkadot/api";
import { Redirect } from "react-router-dom";
import axios from "axios";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faReply,
  faArrowLeft,
  faAngleLeft,
} from "@fortawesome/free-solid-svg-icons";
import { ProgressBar } from "react-bootstrap";
import Identicon from "@polkadot/react-identicon";
import TextareaAutosize from "react-autosize-textarea";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import wsProvider from "../util/WsProvider";
import { postNote, putNote, deleteNote } from "../util/NotesApi";
import { sendErrorToServer, checkUserBalance } from "../util/Utils";
import SimpleButton from "../components/SimpleButton";
import * as Sentry from "@sentry/react";
import "./style.css";
import "./composeStyles.css";

import YibanLoader from "../components/YibanLoader";

const { decodeAddress, encodeAddress } = require("@polkadot/keyring");
const { hexToU8a, isHex } = require("@polkadot/util");

const isValidPolkadotAddress = (address) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (err) {
    sendErrorToServer(err);
    Sentry.captureException(err);
    return false;
  }
};

class AccountItem extends Component {
  render() {
    return (
      <li className="m-2" key={this.props.account.address.toString()}>
        <div
          className="m-4"
          onClick={() => this.props.action(this.props.account)}
        >
          <Identicon
            className="my-class"
            value={this.props.account.address}
            size={64}
            theme={"polkadot"}
          />
          <span> </span>
          {this.props.account.meta.name}
        </div>
      </li>
    );
  }
}

let CryptoJS = require("crypto-js");

class ComposeScreen extends Component {
  constructor() {
    super();
    this.textAreaRef = React.createRef();
    this.handler = this.handler.bind(this);
    this.state = {
      message: "",
      loading: false,
      creating: false,
      messageSent: false,
      encryptMessage: false,
      recipient: "",
      accountIndex: 0,
      accounts: [],
      error: false,
      errorMessage: "",
      messageRecipient: "",
      messageSubject: "",
      noteIndex: NaN,
      noteUuid: NaN,
      percentCompleted: 0,
    };
  }

  handler(acc) {
    this.setState({
      selectedAccount: acc,
    });

    global.addr = acc.address;
    global.currentAccount = acc;
    localStorage.setItem("walletAddress", acc.address);
    localStorage.setItem("currentAccount", JSON.stringify(acc));
  }

  pinFileToIPFS = async (pinataApiKey, pinataSecretApiKey, JSONBody) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    let hashToReturn = "";

    // If user has entered their own pinata key, send the IPFS request client side
    if (pinataApiKey) {
      await axios
        .post(url, JSONBody, {
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        })
        .then(function (response) {
          hashToReturn = response.data.IpfsHash;
        })
        .catch((err) => {
          console.log("ERROR PINNING FILE TO IPFS!");
          console.log("err.message: ", err.message);

          this.setState({
            error: true,
            errorMessage:
              "Your Pinata keys are invalid. Please make sure you have pasted them correctly",
            loading: false,
          });
          throw Error("pinata error");
        });
    } else {
      await postNote(JSONBody)
        .then((res) => {
          hashToReturn = res.IpfsHash;
          console.log("RES: ", res);
          this.setState({ noteUuid: res.uuid });
        })
        .catch((err) => {
          this.setState({
            error: true,
            errorMessage: "error pinning to IPFS. Please try again later",
            loading: false,
          });
          console.log(err);
        });
    }

    return hashToReturn;
  };

  async writeHashToBlockchain(noteHash) {
    await web3Enable("YibanChen");
    await web3Accounts();
    const account = this.state.selectedAccount;
    const injector = await web3FromSource(account.meta.source);

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

    let txHash;
    let txs = [];

    // Put the note hash on the blockchain
    txHash = await api.tx.note.create(noteHash);

    const nextNoteIdObject = await api.query.note.nextNoteId();
    const nextNoteId = nextNoteIdObject.words[0];

    // Transfer the note to the recipient
    let transfer = api.tx.note.transfer(
      this.state.messageRecipient,
      nextNoteId
    );

    // Sign and send these transacations as a batch so that password prompt only appears once
    txs.push(txHash);
    txs.push(transfer);

    if (!this.state.error) {
      try {
        await api.tx.utility
          .batch(txs)
          .signAndSend(
            account.address,
            { signer: injector.signer },
            ({ events = [], status }) => {
              this.setState({ creating: false });
              if (status.isInBlock) {
                events.forEach(
                  ({ event: { data, method, section }, phase }) => {
                    const noteI = Number(data[1]);

                    if (!isNaN(noteI)) {
                      this.setState({ noteIndex: noteI });
                    }
                  }
                );
              } else if (status.isFinalized) {
                console.log("Finalized block hash", status.asFinalized.toHex());
                this.confirmNoteUpload(
                  this.state.noteIndex,
                  this.state.noteUuid
                );

                this.setState({
                  sending: false,
                  loading: false,
                  messageSent: true,
                });
              }
            }
          );
      } catch (err) {
        this.setState({
          error: true,
          errorMessage: "Cancelled",
          loading: false,
        });
        this.removeNote(this.state.noteUuid, noteHash);
        console.log(err);
        if (err.message !== "Cancelled") {
          sendErrorToServer(err);
          Sentry.captureException(err);
        }
      }
    }

    console.log(`txHash2: ${txHash}`);
  }

  confirmNoteUpload = async (index, uuid) => {
    const data = {};
    data["noteIndex"] = index;
    await putNote(uuid, data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        this.setState({
          error: true,
          errorMessage: "error pinning to IPFS. Please try again later",
          loading: false,
        });
        console.log(err);
      });
  };

  removeNote = async (uuid, IpfsHash) => {
    const data = { IpfsHash: IpfsHash };
    console.log("uuid to delete: ", uuid);
    data["siteUuid"] = uuid;

    await deleteNote(uuid, data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        this.setState({
          error: true,
          errorMessage: "error pinning to IPFS. Please try again later",
          loading: false,
        });
        console.log(err);
      });
  };

  sendMessage = async () => {
    try {
      this.setState({ loading: true, creating: true });

      // Make sure recipient address is valid Polkadot address
      const isValid = isValidPolkadotAddress(this.state.messageRecipient);

      if (!isValid) {
        alert(
          "The recipient address you have entered is not a valid Polkadot address. Please make sure you have entered it correctly."
        );
        this.setState({
          loading: false,
          creating: false,
        });
        return;
      }

      const userHasEnoughTokens = await checkUserBalance(
        this.state.selectedAccount.address,
        this.polkadotApi
      );
      if (!userHasEnoughTokens) {
        alert("You have insufficient funds to make this transacation.");
        this.setState({ loading: false, creating: false });
        return;
      }

      // Alert user if subject is empty

      if (this.state.messageSubject === "") {
        const continueWithoutSubject = window.confirm(
          "You are about to send your message with no subject. Continue?"
        );
        if (!continueWithoutSubject) {
          this.setState({ loading: false, creating: false });
          return;
        }
      }

      // Alert user if body is empty

      if (this.state.message === "") {
        const continueWithoutMessage = window.confirm(
          "Your message has no body. Continue?"
        );
        if (!continueWithoutMessage) {
          this.setState({ loading: false, creating: false });
          return;
        }
      }

      let pinataKey;
      let pinataSecretKey;

      const usePersonalPinataKey =
        localStorage.getItem("usePersonalPinataKey") === "true";

      if (usePersonalPinataKey) {
        pinataKey = localStorage.getItem("pinataKey");
        pinataSecretKey = localStorage.getItem("pinataSecretKey");
      }

      let messageToSend = this.state.message;
      let timestamp = new Date().toISOString();

      let jsonBody = {
        note: messageToSend.toString(),
        subject: this.state.messageSubject,
        timestamp: timestamp.toString(),
        encrypted: this.state.encryptMessage,
        sender: { address: this.state.selectedAccount.address },
      };

      let noteHash = await this.pinFileToIPFS(
        pinataKey,
        pinataSecretKey,
        jsonBody
      ); // pin file to IPFS via pinata and get the hash

      console.log("calling write hash to chain");

      this.writeHashToBlockchain(noteHash);
    } catch (err) {
      console.log("error: ", err);
      this.setState({ error: true, loading: false });
      sendErrorToServer(err);
      Sentry.captureException(err);
      return;
    }
  };

  setMessage = (e) => {
    this.setState({ message: e.target.value });
  };

  setEncryptMessage = (e) => {
    if (this.state.encryptMessage === true) {
      this.setState({ encryptMessage: false });
    } else {
      this.setState({ encryptMessage: true });
    }
  };

  setRecipient = (e) => {
    this.setState({ recipient: e.target.value });
  };

  async componentDidMount() {
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

    if (this.props.location) {
      if (this.props.location.state) {
        // state was passed
        const { sender } = this.props.location.state;

        this.setState({ messageRecipient: sender });
      }
    }

    if (this.props.suggestedRecipient) {
      this.setState({ messageRecipient: this.props.suggestedRecipient });
    }

    if (this.props.suggestedSubject) {
      this.setState({ messageSubject: this.props.suggestedSubject });
    }

    if (this.props.suggestedBody) {
      this.setState({ message: ` > ${this.props.suggestedBody} \n \n` });
    }

    await web3Enable("YibanChen");

    if (!!localStorage.getItem("currentAccount")) {
      this.setState({
        selectedAccount: JSON.parse(localStorage.getItem("currentAccount")),
      });
    }

    const allAccounts = await web3Accounts();
    for (let [i, acc] of allAccounts.entries()) {
      acc["idx"] = i;
      var joined = this.state.accounts.concat(acc);
      this.setState({ accounts: joined });
    }
  }

  goBack = () => {
    this.setState({ error: false, errorMessage: "" });
  };

  render() {
    if (!!!localStorage.getItem("currentAccount")) {
      console.log("REDIRECTING TO ABOUT");
      return <Redirect to="/about"></Redirect>;
    }
    if (this.state.error) {
      return (
        <div className="text-center">
          <h1 className="centered">Error sending message</h1>
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

    if (this.state.messageSent) {
      return (
        <div className="centered m-4">
          <h2 id="sent-confirmation">Your message was sent!</h2>
          <Button variant="secondary" className="mt-4 btn-md" href="/inbox">
            <div className="back-button-container">
              <FontAwesomeIcon icon={faAngleLeft} className="mr-1 back-caret" />
              <h5>{"\t"}Back to Inbox</h5>
            </div>
          </Button>
        </div>
      );
    } else {
      return (
        <div>
          <div className="centered">
            {this.state.loading ? (
              this.state.creating ? (
                <div className="centered m-4">
                  <YibanLoader
                    type="Puff"
                    color="#02C3FC"
                    height={100}
                    width={100}
                  />
                  <h2> Connecting to the Blockchain... </h2>
                  <ProgressBar
                    id="inboxProgress"
                    animated
                    now={this.state.percentCompleted}
                  />
                </div>
              ) : (
                <div className="centered m-4">
                  <YibanLoader
                    type="Puff"
                    color="#02C3FC"
                    height={100}
                    width={100}
                  />
                  <h2> Sending message... </h2>
                </div>
              )
            ) : (
              <h4 className="m-4">Compose a Message</h4>
            )}
            <div className="form-group form-inline">
              <label style={{ marginRight: "52.5px", fontSize: "1.25em" }}>
                To:
              </label>
              <input
                className="smallInput"
                id="to-field"
                onChange={(e) =>
                  this.setState({ messageRecipient: e.target.value })
                }
                defaultValue={
                  this.props.suggestedRecipient
                    ? this.props.suggestedRecipient
                    : ""
                }
                maxLength="50"
                spellCheck="false"
                value={this.state.messageRecipient}
                placeholder="Recipient Wallet Address"
              ></input>
            </div>
            <div className="form-group form-inline">
              <label style={{ marginRight: "5px", fontSize: "1.25em" }}>
                Subject:
              </label>
              <input
                className="smallInput"
                id="subject-field"
                onChange={(e) =>
                  this.setState({ messageSubject: e.target.value })
                }
                defaultValue={this.state.messageSubject}
                rows={1}
                cols={52}
                maxLength={65}
                spellCheck="false"
              ></input>
            </div>
            <div className="form-group form-inline scroll-flow">
              <TextareaAutosize
                ref={this.textAreaRef}
                id="body-field"
                onResize={(e) => {}}
                className="bigInput"
                rows={12}
                maxRows={15}
                cols={110}
                onChange={(e) => this.setMessage(e)}
                defaultValue={this.state.message}
                placeholder="Write a message..."
              />
            </div>
            <SimpleButton
              action={this.sendMessage}
              buttonSize="lg"
              buttonText="Send"
              buttonId="send-button"
            ></SimpleButton>
          </div>
        </div>
      );
    }
  }
}

export default ComposeScreen;
