import React, { Component } from "react";
import { ApiPromise } from "@polkadot/api";
import { Redirect } from "react-router-dom";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Modal from "react-modal";
import Loader from "react-loader-spinner";
import Identicon from "@polkadot/react-identicon";
import TextareaAutosize from "react-autosize-textarea";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import wsProvider from "../util/WsProvider";
import "./style.css";
import SimpleButton from "../components/SimpleButton";

const { decodeAddress, encodeAddress } = require("@polkadot/keyring");
const { hexToU8a, isHex } = require("@polkadot/util");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    color: "#eeeeee",
    backgroundColor: "#333333",
  },
};

const isValidPolkadotAddress = (address) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (error) {
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

// Modal.setAppElement("#root");
const { Keyring } = require("@polkadot/keyring");
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
      modalIsOpen: false,
      accountSelectionModalIsOpen: false,
      accountIndex: 0,
      accounts: [],
      error: false,
      errorMessage: "",
      messageRecipient: "",
      messageSubject: "",
      noteIndex: NaN,
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

    this.closeAccountSelectionModal();
  }

  openModal = () => {
    this.setState({ modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  openAccountSelectionModal = () => {
    this.setState({ accountSelectionModalIsOpen: true });
  };

  closeAccountSelectionModal = () => {
    this.setState({ accountSelectionModalIsOpen: false });
  };

  pinFileToIPFS = async (pinataApiKey, pinataSecretApiKey, JSONBody) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    let hashToReturn = "";

    // If user has entered their own pinata key, send the IPFS request client side
    if (pinataApiKey) {
      let data = await axios
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
          throw "pinata error";
        });
      // Otherwise, send it to our server
    } else {
      let nodeData = await axios
        .post("https://api.yibanchen.com:443/pinMessage", JSONBody, {
          headers: {},
        })
        .then(function (response) {
          hashToReturn = response.data.IpfsHash;
        })
        .catch((err) => {
          console.log("error calling node backend");
          console.log("err.message: ", err.message);

          this.setState({
            error: true,
            errorMessage: "error pinning file to IPFS. Please try again later",
            loading: false,
          });
          throw "node error";
        });
    }

    return hashToReturn;
  };

  async writeHashToBlockchain(noteHash) {
    try {
      const extensions = await web3Enable("YibanChen");
      const allAccounts = await web3Accounts();
      const account = this.state.selectedAccount;
      const injector = await web3FromSource(account.meta.source);
      const api = await ApiPromise.create({
        // Create an API instance
        provider: wsProvider,
        types: {
          //AccountInfo: "AccountInfoWithDualRefCount",
          ClassId: "u32",
          ClassIdOf: "ClassId",
          TokenId: "u64",
          TokenIdOf: "TokenId",
          TokenInfoOf: {
            metadata: "CID",
            owner: "AccountId",
            data: "TokenData"
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
      // Transfer tokens from Alice dev account to user account
      // Helpful during development process of testing new wallets

      // const keyring = new Keyring({ type: "sr25519" });
      // const alice = keyring.addFromUri("//Alice");
      // const { nonce, data: balance } = await api.query.system.account(
      //   this.state.selectedAccount.address
      // );

      // const transfer = api.tx.balances.transfer(
      //   this.state.selectedAccount.address,
      //   1234500000
      // );
      // const transferHash = await transfer.signAndSend(alice);

      let txHash;
      let txs = [];

      try {
        // Put the note hash on the blockchain
        txHash = await api.tx.note.create(noteHash);

        // Transfer the note to the recipient
        let transfer = api.tx.note.transfer(
          this.state.messageRecipient,
          this.state.noteIndex
        );

        // Sign and send these transacations as a batch so that password prompt only appears once
        txs.push(txHash);
        txs.push(transfer);
        this.setState({ creating: false });
        api.tx.utility
          .batch(txs)
          .signAndSend(
            account.address,
            { signer: injector.signer },
            ({ events = [], status }) => {
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

                this.setState({
                  sending: false,
                  loading: false,
                  messageSent: true,
                });
              }
            }
          );
      } catch (err) {
        console.log("error transfering note");
        console.log("err: ", err, typeof err, err.message);
        this.setState({
          error: true,
          errorMessage: err.message,
          loading: false,
        });
      }
      console.log(`txHash2: ${txHash}`);
    } catch (err) {
      console.log("error writing hash to blockchain");
      console.log(err);
      this.setState({ error: true, errorMessage: err.message, loading: false });
      return;
    }
  }

  sendMessage = async () => {
    try {
      this.setState({ loading: true, creating: true });

      // Make sure recipient address is valid Polkadot address
      const isValid = isValidPolkadotAddress(this.state.messageRecipient);

      if (!isValid) {
        this.setState({
          loading: false,
          creating: false,
          error: true,
          errorMessage:
            "The recipient address you have entered is not a valid Polkadot address. Please make sure you have entered it correctly.",
        });
        throw "invalid recipient";
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

      // Encrypt the message
      let messageToSend = this.state.message;
      let timestamp = new Date().toISOString();

      if (this.state.encryptMessage) {
        const encrypted = CryptoJS.AES.encrypt(
          this.state.message,
          global.secret
        );
        const encryptedTimestamp = CryptoJS.AES.encrypt(
          timestamp,
          global.secret
        );
        messageToSend = encrypted;
        timestamp = encryptedTimestamp;
      }

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

      this.writeHashToBlockchain(noteHash);
    } catch (err) {
      console.log("error: ", err);
      this.setState({ error: true, loading: false });
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
    console.log(`suggested subject: ${this.props.suggestedSubject}`);
    console.log(`suggested subject: ${this.props.suggestedBody}`);

    if (this.props.location) {
      if (this.props.location.state) {
        // state was passed
        const { sender } = this.props.location.state;

        this.setState({ messageRecipient: sender });
      }
    }

    if (this.props.sender) {
      this.setState({ messageRecipient: this.props.sender });
    }

    if (this.props.suggestedSubject) {
      this.setState({ messageSubject: this.props.suggestedSubject });
    }

    if (this.props.suggestedBody) {
      this.setState({ message: ` > ${this.props.suggestedBody} \n \n` });
    }

    const extensions = await web3Enable("YibanChen");

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
    if (this.state.error) {
      return (
        <div>
          <h1 className="centered">Error sending message</h1>
          <p className="centered">{this.state.errorMessage}</p>
          <Button
            variant="secondary"
            className="btn-primary btn-lg m-2"
            onClick={this.goBack}
          >
            Back
          </Button>
        </div>
      );
    }
    if (!!!localStorage.getItem("currentAccount")) {
      return <Redirect to="/"></Redirect>;
    }
    if (this.state.loading) {
      if (this.state.creating) {
        return (
          <div className="centered m-4">
            <Loader type="Puff" color="#02C3FC" height={100} width={100} />
            <h2> Sending message... </h2>
          </div>
        );
      } else {
        return (
          <div className="centered m-4">
            <Loader type="Puff" color="#02C3FC" height={100} width={100} />
            <h2> Sending message... </h2>
          </div>
        );
      }
    }
    if (this.state.messageSent) {
      return (
        <div className="centered m-4">
          <h2>Your message was sent!</h2>
        </div>
      );
    } else {
      return (
        <div>
          <Modal
            style={customStyles}
            isOpen={this.state.accountSelectionModalIsOpen}
            onRequestClose={this.closeAccountSelectionModal}
            shouldCloseOnOverlayClick={false}
          >
            <h2>Please select the account you wish to use</h2>
            <ul className="accountListContainer">
              {this.state.accounts.map(function (acc, idx) {
                return (
                  <AccountItem
                    action={this.handler}
                    key={idx}
                    account={acc}
                  ></AccountItem>
                );
              }, this)}
            </ul>
          </Modal>
          <Modal
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal}
            style={customStyles}
            contentLabel="Example Modal"
            sho
            uldCloseOnOverlayClick={false}
          >
            <h2>
              The Polkadot.js browser extension is required to create notes.
            </h2>
            <p>
              You can download it{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://polkadot.js.org/extension/"
              >
                here
              </a>
            </p>
            <p>
              After downloading and signing into the extension, please reload
              this page.
            </p>
          </Modal>
          <div className="centered">
            <h4 className="m-4">Compose a Message</h4>
            <div className="form-group form-inline">
              <label style={{ marginRight: "52.5px", fontSize: "1.25em" }}>
                To:
              </label>
              <TextareaAutosize
                className="messageInput"
                onChange={(e) =>
                  this.setState({ messageRecipient: e.target.value })
                }
                defaultValue={this.state.messageRecipient}
                rows={1}
                cols={52}
                maxLength="50"
                spellCheck="false"
                placeholder="Recipient Address"
              ></TextareaAutosize>
            </div>
            <div className="form-group form-inline">
              <label style={{ marginRight: "5px", fontSize: "1.25em" }}>
                Subject:
              </label>
              <TextareaAutosize
                className="messageInput"
                onChange={(e) =>
                  this.setState({ messageSubject: e.target.value })
                }
                defaultValue={this.state.messageSubject}
                rows={1}
                cols={52}
                maxLength={65}
                spellCheck="false"
              ></TextareaAutosize>
            </div>
            <div className="form-group form-inline scroll-flow">
              <TextareaAutosize
                ref={this.textAreaRef}
                onResize={(e) => { }}
                className="messageInput"
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
            ></SimpleButton>
          </div>
        </div>
      );
    }
  }
}

export default ComposeScreen;
