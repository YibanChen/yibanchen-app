import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { Pagination } from "react-bootstrap";
import { ApiPromise } from "@polkadot/api";
import Button from "react-bootstrap/Button";
import Modal from "react-modal";
import ModalDialog from "react-bootstrap/ModalDialog";
import Draggable from "react-draggable";
import ComposeScreen from "../pages/Compose";
import axios from "axios";
import "../pages/style.css";
import customStyles from "../util/CustomStyles";
import Identicon from "@polkadot/react-identicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faReply } from "@fortawesome/free-solid-svg-icons";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";

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

    const { unused_nonce, data: balance } =
      await this.props.polkadotApi.query.system.account(account.address);

    if (Number(balance.free) === 0) {
      this.setState({
        error: true,
        errorMessage:
          "Your wallet has insufficent funds to transfer this message. \n Please top up and try again.",
        transferringNote: false,
      });
      return;
    }

    const transfer = this.props.polkadotApi.tx.note.transfer(
      this.state.messageRecipient,
      this.props.messageToFocus.noteId
    );

    const { nonce } = await this.props.polkadotApi.query.system.account(
      global.addr
    );

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

    try {
      const account = JSON.parse(localStorage.getItem("currentAccount"));
      const extensions = await web3Enable("YibanChen");
      const injector = await web3FromSource(account.meta.source);

      const deletedNote = await this.props.polkadotApi.tx.note
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

      this.props.removeFromNotes(this.props.messageToFocus.noteId);
    } catch (err) {
      console.log(`ERROR DELETEING NOTE: ${err}`);
    }
  };

  closeModal = () => {
    this.setState({ displayComposeModal: false });
  };

  showMoreAndCopyAddress = (address) => {
    if (this.state.showFullAddress) {
      this.setState({ showFullAddress: false });
    } else {
      this.setState({ showFullAddress: true });
    }
    // navigator.clipboard.writeText(address);
  };

  checkIfTextWasHighlighted = () => {
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
          isOpen={this.state.displayComposeModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="DownloadExtensionModal"
        >
          <Button
            className="close-button"
            variant="secondary"
            onClick={this.closeModal}
          >
            X
          </Button>
          <ComposeScreen
            suggestedRecipient={
              this.props.messageToFocus.sender
                ? this.props.messageToFocus.sender.address
                : ""
            }
            suggestedSubject={
              this.props.messageToFocus.subject
                ? `re: ${this.props.messageToFocus.subject}`
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
            <div className="subject-info-container"></div>

            {this.props.messageToFocus.sender ? (
              <div className="sender-info-container">
                <h5 className="bold-text"> From: </h5>
                <Identicon
                  value={this.props.messageToFocus.sender.address}
                  size={42}
                  theme={"polkadot"}
                  className=" mr-2 mb-2 ml-2"
                />{" "}
                <h4
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
                </h4>
              </div>
            ) : (
              " From: Address not available"
            )}

            <div className="timestamp-info-container">
              <h5 className="bold-text">Date:</h5>{" "}
              <h4 className="ml-2">
                {" "}
                {this.props.messageToFocus.timestamp} (
                {this.props.messageToFocus.time_distance})
              </h4>
            </div>

            <div className="subject-info-container">
              <h5 className="mb-4 bold-text">
                Subject:
                {this.props.messageToFocus.subject
                  ? `   ${this.props.messageToFocus.subject}`
                  : "No subject"}
              </h5>
            </div>

            <div className="note-button-corner mt-4">
              <Button
                variant="secondary"
                className="btn-primary btn-sm m-2 mt-3 "
                aria-label="reply"
                onClick={this.setDisplayComposeModal}
              >
                <FontAwesomeIcon icon={faReply} />
              </Button>
              <Button
                variant="danger"
                className="btn-primary btn-sm m-2 mt-3"
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
              <div
                className="message-body"
                onMouseUp={this.checkIfTextWasHighlighted}
              >
                <p onMouseUp={this.checkIfTextWasHighlighted}>
                  {this.props.messageToFocus.message}
                </p>
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

export default NoteDetails;
