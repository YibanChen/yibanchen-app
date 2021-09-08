import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { Pagination } from "react-bootstrap";
import { ApiPromise } from "@polkadot/api";
import Button from "react-bootstrap/Button";
import Modal from "react-modal";
import ModalDialog from "react-bootstrap/ModalDialog";
import Draggable from "react-draggable";
import ComposeScreen from "./Compose";
import axios from "axios";
import "./style.css";
import Loader from "react-loader-spinner";
import Identicon from "@polkadot/react-identicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faReply } from "@fortawesome/free-solid-svg-icons";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import { format, formatDistance } from "date-fns";
import wsProvider from "../util/WsProvider";

const { Keyring } = require("@polkadot/keyring");

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
  overlay: {
    backdropFilter: "blur(2px)",
  },
};

class DraggableModalDialog extends Component {
  render() {
    return (
      <Draggable handle=".modal-title">
        <ModalDialog {...this.props} />
      </Draggable>
    );
  }
}

function convertUTCDateToLocalDate(date) {
  var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

  var offset = date.getTimezoneOffset() / 60;
  var hours = date.getHours();

  newDate.setHours(hours - offset);

  return newDate;
}

class NoteItem extends Component {
  render() {
    console.log(`this.props.active: ${this.props.active}`);
    if (this.props.active !== this.props.messageObject.pageNumber) {
      return <div></div>;
    }
    return (
      <div
        className={
          this.props.messageToFocus === this.props.messageObject
            ? "focusedNote m-1"
            : "noteSection m-1"
        }
        onClick={() => this.props.action(this.props.messageObject)}
      >
        <div className="centered">
          <p className="mt-3">{this.props.messageObject.timestamp}</p>
          <Identicon
            value={
              this.props.messageObject.sender
                ? this.props.messageObject.sender.address
                : ""
            }
            size={32}
            theme={"polkadot"}
          />
          <p>
            {this.props.messageObject.sender
              ? `${this.props.messageObject.sender.address.slice(
                0,
                6
              )}...${this.props.messageObject.sender.address.slice(42, 48)}`
              : ""}
          </p>
          <br />
          <p>
            {this.props.messageObject.subject.length > 30
              ? `${this.props.messageObject.subject.slice(0, 30)}...`
              : this.props.messageObject.subject}
          </p>
        </div>
      </div>
    );
  }
}

class NoteDetails extends Component {
  constructor() {
    super();
    this.state = {
      messageRecipient: "",
      noteTransferred: false,
      noteTransferredMessage: "",
      transferringNote: false,
      error: false,
      errorMessage: "",
      displayComposeModal: false,
      showFullAddress: false,
      quoteAndReply: false,
    };
  }

  transferMessage = async () => {
    this.setState({ transferringNote: true });
    const extensions = await web3Enable("YibanChen");
    const allAccounts = await web3Accounts();
    const account = JSON.parse(localStorage.getItem("currentAccount"));

    const injector = await web3FromSource(account.meta.source);

    const api = await ApiPromise.create({
      // Create an API instance
      provider: wsProvider,
      types: {
      //  AccountInfo: "AccountInfoWithDualRefCount",
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
    const { unused_nonce, data: balance } = await api.query.system.account(
      account.address
    );

    if (Number(balance.free) === 0) {
      this.setState({
        error: true,
        errorMessage:
          "Your wallet has insufficent funds to transfer this message. \n Please top up and try again.",
        transferringNote: false,
      });
      return;
    }

    const transfer = api.tx.note.transfer(
      this.state.messageRecipient,
      this.props.messageToFocus.noteId
    );

    const { nonce } = await api.query.system.account(global.addr);

    const txHash = await transfer.signAndSend(account.address, {
      signer: injector.signer,
    });

    this.setState({
      transferringNote: false,
      noteTransferred: true,
      noteTransferredMessage: "Note transferred!",
    });

    this.props.removeFromNotes(this.props.messageToFocus.noteId);
  };

  composeReply = () => {
    console.log("hello world");
  };

  setDisplayComposeModal = (e) => {
    console.log(this.state.displayComposeModal);
    if (this.state.displayComposeModal === true) {
      this.setState({ displayComposeModal: false });
    } else {
      this.setState({ displayComposeModal: true });
    }
  };

  deleteMessage = async (messageToDelete) => {
    const continueWithDeletion = window.confirm(
      "Are you sure you want to delete this note? You cannot undo this action."
    );
    if (!continueWithDeletion) {
      return;
    }

    const api = await ApiPromise.create({
      // Create an API instance
      provider: wsProvider,
      types: {
      //  AccountInfo: "AccountInfoWithDualRefCount",
        Note: "Text",
        NoteIndex: "u32",
      },
    });
    try {
      const account = JSON.parse(localStorage.getItem("currentAccount"));
      const extensions = await web3Enable("YibanChen");
      const injector = await web3FromSource(account.meta.source);

      const deletedNote = await api.tx.note
        .burn(messageToDelete.noteId)
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ events = [], status }) => {
            if (status.isInBlock) {
              events.forEach(({ event: { data, method, section }, phase }) => {
                const noteI = Number(data[1]);

                if (!isNaN(noteI)) {
                  this.setState({ noteIndex: noteI });
                }
              });
            } else if (status.isFinalized) {
              console.log("Finalized block hash", status.asFinalized.toHex());
            }
          }
        );
      console.log("deleted!");
      this.props.removeFromNotes(this.props.messageToFocus.noteId);
    } catch (err) {
      console.log(`ERROR DELETEING NOTE: ${err}`);
    }
  };

  closeModal = () => {
    this.setState({ displayComposeModal: false });
  };

  showMoreAndCopyAddress = (address) => {
    console.log("showing more!");
    if (this.state.showFullAddress) {
      this.setState({ showFullAddress: false });
    } else {
      this.setState({ showFullAddress: true });
    }
    // navigator.clipboard.writeText(address);
  };

  checkIfTextWasHighlighted = () => {
    console.log(window.getSelection().toString());
    console.log(window.getSelection().toString() === "");
    if (window.getSelection().toString() !== "") {
      this.setState({ quoteAndReply: true });
    }

    if (window.getSelection().toString() === "") {
      this.setState({ quoteAndReply: false });
    }
  };

  componentDidMount() {
    this.setState({ noteTransferred: false });
  }

  render() {
    let composeModal;
    if (this.state.displayComposeModal) {
      composeModal = (
        <Modal
          dialogAs={DraggableModalDialog}
          isOpen={this.state.displayComposeModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="DownloadExtensionModal"
        >
          <ComposeScreen
            suggestedRecipient={
              this.props.messageToFocus.sender
                ? this.props.messageToFocus.sender.address
                : ""
            }
            suggestedSubject={
              this.props.messageToFocus.subject
                ? "re: " + this.props.messageToFocus.subject
                : "re: No subject"
            }
            suggestedBody={window.getSelection().toString()}
          ></ComposeScreen>
        </Modal>
      );
    }
    if (this.props.messageToFocus) {
      return (
        <div className="messageBox" onMouseUp={this.checkIfTextWasHighlighted}>
          <div className="header-row">
            <div className="subject-info-container">
              <h5 className="bold-text">Subject: </h5>
              <h5 className="ml-2">
                {this.props.messageToFocus.subject
                  ? `   ${this.props.messageToFocus.subject}`
                  : "No subject"}
              </h5>
            </div>

            {this.props.messageToFocus.sender ? (
              <div className="sender-info-container">
                <h5 className="bold-text"> From: </h5>
                <Identicon
                  value={this.props.messageToFocus.sender.address}
                  size={42}
                  theme={"polkadot"}
                  className="m-1 mr-2 mb-2 ml-2"
                />{" "}
                <h5
                  className="sender-address"
                  onClick={() =>
                    this.showMoreAndCopyAddress(
                      this.props.messageToFocus.sender.address
                    )
                  }
                >
                  {this.state.showFullAddress === false
                    ? `${this.props.messageToFocus.sender.address.slice(
                      0,
                      6
                    )}...${this.props.messageToFocus.sender.address.slice(
                      42,
                      48
                    )}`
                    : this.props.messageToFocus.sender.address}
                </h5>
              </div>
            ) : (
              " From: Address not available"
            )}

            <div className="timestamp-info-container">
              <h5 className="bold-text">Date:</h5>{" "}
              <h5 className="ml-2">
                {" "}
                {this.props.messageToFocus.timestamp} (
                {this.props.messageToFocus.time_distance})
              </h5>
            </div>
            <div className="message-actions">
              <Button
                variant="secondary"
                className="btn-primary btn-sm m-2"
                aria-label="reply"
                onClick={this.setDisplayComposeModal}
              >
                <FontAwesomeIcon icon={faReply} />
              </Button>
              <Button
                variant="danger"
                className="btn-primary btn-sm m-2"
                aria-label="delete"
                onClick={() => this.deleteMessage(this.props.messageToFocus)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </div>

            {composeModal}
          </div>
          <br />
          <hr className="note-divider" />
          <div
            className="fixedWidth"
            onMouseUp={this.checkIfTextWasHighlighted}
          >
            <div
              className="message-text"
              onMouseUp={this.checkIfTextWasHighlighted}
            >
              <h4 className="mb-4 bold-text">Body</h4>
              <div
                className="message-body"
                onMouseUp={this.checkIfTextWasHighlighted}
              >
                <p onMouseUp={this.checkIfTextWasHighlighted}>
                  {this.props.messageToFocus.message}
                </p>
                <div className="message-actions-below">
                  <Button
                    variant="secondary"
                    className="btn-primary btn-sm"
                    aria-label="reply"
                    onClick={this.setDisplayComposeModal}
                  >
                    <FontAwesomeIcon icon={faReply} />{" "}
                    {this.state.quoteAndReply ? "Quote and Reply" : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <p>{this.state.errorMessage}</p>
        </div>
      );
    } else {
      return <div></div>;
    }
  }
}

function EmptyList(props) {
  return (
    <div className="centered no-messages">
      <p>No messages found</p>
    </div>
  );
}

export class Notes extends Component {
  constructor() {
    super();
    this.focusNote = this.focusNote.bind(this);
    this.removeFromNotes = this.removeFromNotes.bind(this);
    this.notesPerPage = 1000;
    this.state = {
      active: 0,

      notes: [],
      loading: true,
      error: false,
      errorMessage: "",
      focusedNote: "",
    };
  }

  focusNote(mes) {
    this.setState({
      focusedNote: mes,
    });
  }

  removeFromNotes(note) {
    const newNotes = this.state.notes.filter((obj) => {
      return obj.noteId !== note;
    });
    this.setState({
      notes: newNotes,
      notesToDisplay: newNotes,
    });
    this.setState({
      focusedNote: this.state.notesToDisplay[0]
        ? this.state.notesToDisplay[0]
        : "",
    });
    this.filterNotes(this.state.searchTerm);
  }

  async loadNoteHashes() {
    const account = JSON.parse(localStorage.getItem("currentAccount"));
    const api = await ApiPromise.create({
      // Create an API instance
      provider: wsProvider,
      types: {
      //  AccountInfo: "AccountInfoWithDualRefCount",
        Note: "Text",
        NoteIndex: "u32",
      },
    });

    try {
      if (global.currentAccount === "") {
        throw Error("No wallet global.address found!");
      }
      let hashes = [];

      const allEntries = await api.query.note.notes.entries(account.address);
      allEntries.forEach(
        ([
          {
            args: [acc, index],
          },
          note,
        ]) => {
          hashes.push({ hash: note.toHuman(), noteId: index });
        }
      );

      return hashes;
    } catch (err) {
      console.log("error: ", err);
      this.setState({ error: true });
      if (global.addr === "") {
        this.setState({
          errorMessage:
            "No wallet found! Please enter your wallet global.address in Settings.",
        });
      } else {
        this.setState({
          errorMessage:
            "There was an error retrieving your notes. Please make sure you have pasted your wallet global.address correctly.",
        });
      }
      console.log(err);
    }
  }

  loadNotes = async () => {
    global.secret = localStorage.getItem("secretKey") || "";
    try {
      this.setState({ loading: true, error: false });
      let hashes = await this.loadNoteHashes(); // Load the hashes of the notes
      let ipfsNotes = [];
      for (const [i, h] of hashes.entries()) {
        let hashAsString = JSON.stringify(h.hash); // API returns an object, so convert to string
        hashAsString = hashAsString.substring(1, hashAsString.length - 1); // The hashes are returned with quotes as part of the hash, so the quotes need to be removed
        if (hashAsString === "" || hashAsString === "ul") {
          console.log("bad hash found");
          continue;
        }
        await axios // Query IPFS with the hash
          .get("https://ipfs.io/ipfs/" + hashAsString, {
            timeout: 2000,
          })
          .then((response) => {
            let message = response.data.note;
            let n = new Date(response.data.timestamp);
            let m = convertUTCDateToLocalDate(n);
            let sender = response.data.sender;
            let subject = response.data.subject;

            const timestamp_for_sort =
              ("0" + (m.getUTCMonth() + 1)).slice(-2) +
              "/" +
              ("0" + m.getUTCDate()).slice(-2) +
              "/" +
              m.getUTCFullYear() +
              " " +
              ("0" + m.getUTCHours()).slice(-2) +
              ":" +
              ("0" + m.getUTCMinutes()).slice(-2);

            const timestamp = format(n, "LLLL dd yyyy hh:mm aaaaa'm'");
            const distance = formatDistance(n, new Date(), {
              includeSeconds: true,
              addSuffix: true,
            });

            // nothing is encrypted, so completely removed this for now

            /* 
            let messageIsEncrypted = response.data.encrypted;
            if (messageIsEncrypted !== false) {
              console.log("message is encrypted!");
              let bytes = CryptoJS.AES.decrypt(
                message.toString(),
                global.secret
              );
              message = bytes.toString(CryptoJS.enc.Utf8);
              if (timestamp) {
                let timestampBytes = CryptoJS.AES.decrypt(
                  response.data.timestamp.toString(),
                  global.secret
                );
                timestamp = timestampBytes.toString(CryptoJS.enc.Utf8);
              }
            } */
            ipfsNotes.push({
              message: message,
              timestamp: timestamp,
              timestamp_for_sort: timestamp_for_sort,
              time_distance: distance,
              noteId: Number(h.noteId),
              sender: sender,
              subject: subject,
              pageNumber: Math.floor(i / this.notesPerPage),
            });
          })
          .catch(function (error) {
            console.log("AXIOS ERROR");
            console.log(error.message);
            console.log("hash that couldn't be loaded: ", hashAsString);
            if (error.message === "timeout of 1000ms exceeded") {
              console.log(
                `if you are seeing this, it means that the note you tried to access
                 is not available from IPFS yet. try again in a few minutes.`
              );
              console.log("hash that caused the timeout:", hashAsString);
            }
          });
      }

      // sort notes chronologically

      ipfsNotes.sort(
        (a, b) =>
          new Date(b.timestamp_for_sort) - new Date(a.timestamp_for_sort)
      );
      this.setState({
        notes: ipfsNotes,
        notesToDisplay: ipfsNotes,
        loading: false,
        focusedNote: ipfsNotes[0],
      });
    } catch (err) {
      console.log("THERE WAS AN ERROR in loadNotes");
      console.log("err: ", err);
    }
  };

  searchNotes(searchTerm) {
    this.setState({ searchTerm: searchTerm });
    this.filterNotes(searchTerm);
  }

  filterNotes(searchTerm) {
    const term = searchTerm.toLowerCase();

    const newNotes = this.state.notes.filter(
      (note) =>
        note.message.toLowerCase().includes(term) ||
        note.sender.address.toLowerCase().includes(term) ||
        note.subject.toLowerCase().includes(term)
    );
    this.setState({ notesToDisplay: newNotes });
  }

  async componentDidMount() {
    // variables then and now are used to benchmark the inbox loading time
    let then = new Date();
    await this.loadNotes();
    let now = new Date();
    console.log("time taken to load inbox: ", now - then, "ms");
  }

  setActive(num) {
    console.log(`num: ${num}`);
    this.setState({ active: num });
  }

  render() {
    if (!!!localStorage.getItem("currentAccount")) {
      return <Redirect to="/"></Redirect>;
    }
    if (this.state.error) {
      return (
        <div className="centered">
          <p>{this.state.errorMessage}</p>
        </div>
      );
    } else {
      if (this.state.loading) {
        return (
          <div className="centered m-4 p-1">
            <Loader type="Puff" color="#02C3FC" height={200} width={200} />
            <h1 className="m-4 robot">Loading Messages</h1>
          </div>
        );
      } else {
        // pagination stuff
        let active = 0;
        let pageNumbers = [];
        for (
          let number = 0;
          number <= this.state.notesToDisplay.length;
          number = number + this.notesPerPage
        ) {
          console.log(
            `number: ${number} length: ${this.state.notesToDisplay.length}`
          );
          pageNumbers.push(
            <Pagination.Item
              key={number}
              active={
                Math.floor(number / this.notesPerPage) === this.state.active
              }
              onClick={() =>
                this.setActive(Math.floor(number / this.notesPerPage))
              }
            >
              {Math.floor(number / this.notesPerPage) + 1}
            </Pagination.Item>
          );
        }
        return (
          <div id="parent">
            <div className="narrow">
              <div className="searchbar-div centered mb-1 pb-1">
                Search Messages{" "}
                <input
                  className="notes-searchbar"
                  onChange={(e) => this.searchNotes(e.target.value)}
                ></input>
              </div>
              <div
                className={
                  this.state.notesToDisplay.length > this.notesPerPage
                    ? "notes-list-adjusted"
                    : "notes-list"
                }
              >
                {this.state.notesToDisplay.length !== 0 ? (
                  this.state.notesToDisplay.map(function (d, idx) {
                    return (
                      <NoteItem
                        messageToFocus={this.state.focusedNote}
                        active={this.state.active}
                        action={this.focusNote}
                        key={idx}
                        messageObject={d}
                      ></NoteItem>
                    );
                  }, this)
                ) : (
                  <EmptyList></EmptyList>
                )}
              </div>
              {this.state.notesToDisplay.length > this.notesPerPage ? (
                <div className="centered">
                  <Pagination>{pageNumbers}</Pagination>
                </div>
              ) : (
                <div></div>
              )}
            </div>
            <div id="wide">
              <NoteDetails
                messageToFocus={this.state.focusedNote}
                removeFromNotes={this.removeFromNotes}
              />
            </div>
          </div>
        );
      }
    }
  }
}

export default Notes;
