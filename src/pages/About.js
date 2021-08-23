import { React, Component } from "react";
import { Redirect } from "react-router-dom";
import Modal from "react-modal";
import Identicon from "@polkadot/react-identicon";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import AccountListItem from "../components/AccountListItem";

import "./style.css";
import { Dropdown } from "react-bootstrap";

// Modal.setAppElement("#root");

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
    width: "400px",
    height: "400px",
  },
};

class About extends Component {
  constructor() {
    super();
    this.state = {
      accountIsSelected: true,
      extensionIsInstalled: true,
      accounts: [],
    };
  }

  closeAccountSelectionModal = () => {
    this.setState({ accountIsSelected: true });
    console.log(
      "global account: ",
      JSON.parse(localStorage.getItem("currentAccount"))
    );
  };

  componentDidMount = async () => {
    const extensions = await web3Enable("YibanChen");
    const allAccounts = await web3Accounts();

    this.setState({ accounts: allAccounts });

    if (extensions.length === 0) {
      this.setState({ extensionIsInstalled: false });
      console.log("extension isn't installed");
    }
    if (!!!localStorage.getItem("currentAccount")) {
      console.log("hey");
      this.setState({ accountIsSelected: false });
    } else {
      this.setState({
        selectedAccount: JSON.parse(localStorage.getItem("currentAccount")),
      });
    }

    console.log("accounts: ", this.state.accounts);
  };

  handler = (acc) => {
    this.setState({
      selectedAccount: acc,
    });
    console.log("acc: ", acc);
    console.log("selectedAccount: ", this.state.selectedAccount);
    global.addr = acc.address;
    global.currentAccount = acc;
    localStorage.setItem("walletAddress", acc.address);
    localStorage.setItem("currentAccount", JSON.stringify(acc));
    console.log("global account: ", global.currentAccount);
    this.closeAccountSelectionModal();
  };

  render() {
    if (localStorage.getItem("currentAccount")) {
      return <Redirect to="/inbox"></Redirect>;
    }
    return (
      <div className="centered m-3">
        <h1>YibanChen</h1>
        <Modal
          style={customStyles}
          isOpen={!this.state.accountIsSelected}
          onRequestClose={this.closeAccountSelectionModal}
          shouldCloseOnOverlayClick={false}
        >
          <div className="centered">
            <ul className="accountListContainer">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Dropdown className="centered" variant="success">
                  <Dropdown.Toggle variant="primary">
                    Select Account
                    <Identicon
                      className="my-class"
                      value={
                        !!JSON.parse(localStorage.getItem("currentAccount"))
                          ? JSON.parse(localStorage.getItem("currentAccount"))
                              .address
                          : ""
                      }
                      size={48}
                      theme={"polkadot"}
                    />{" "}
                    {JSON.parse(localStorage.getItem("currentAccount"))
                      ? JSON.parse(localStorage.getItem("currentAccount")).meta
                          .name
                      : ""}
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="account-dropdown">
                    {this.state.accounts.map((account) => (
                      <div onClick={() => this.handler(account)}>
                        <Dropdown.Item>
                          <AccountListItem account={account}></AccountListItem>
                        </Dropdown.Item>
                      </div>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </ul>
          </div>
        </Modal>
        <Modal
          isOpen={!this.state.extensionIsInstalled}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="DownloadExtensionModal"
          sho
          uldCloseOnOverlayClick={false}
        >
          <h2>
            The Polkadot.js browser extension is required to use YibanChen.
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
            After downloading and signing into the extension, please reload this
            page.
          </p>
        </Modal>
      </div>
    );
  }
}

export default About;
