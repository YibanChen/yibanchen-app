import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import { Button, Dropdown, Form } from "react-bootstrap";
import Switch from "react-switch";
import YibanLoader from "../components/YibanLoader";
import Identicon from "@polkadot/react-identicon";
import AccountListItem from "../components/AccountListItem";
import {
  web3Accounts,
  web3Enable,
  isWeb3Injected,
} from "@polkadot/extension-dapp";
import { ApiPromise } from "@polkadot/api";
import axios from "axios";
import wsProvider from "../util/WsProvider";

export default function SettingsScreen({ navigation }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletUnit, setWalletUnit] = useState("");
  const [loadedWalletBalance, setLoadedWalletbalance] = useState(false);
  const [extensionAccounts, setExtensionAccounts] = useState([]);
  const [authenticatedKeys, setAuthenticatedKeys] = useState(true);
  const [keysWereVerified, setKeysWereVerified] = useState(false);

  const testAuthentication = () => {
    const url = `https://api.pinata.cloud/data/testAuthentication`;
    return axios
      .get(url, {
        headers: {
          pinata_api_key: localStorage.getItem("pinataKey"),
          pinata_secret_api_key: localStorage.getItem("pinataSecretKey"),
        },
      })
      .then(function (response) {
        console.log("Successfully authenticated");
        setAuthenticatedKeys(true);
        setKeysWereVerified(true);
      })
      .catch(function (error) {
        setAuthenticatedKeys(false);
        setKeysWereVerified(false);
      });
  };

  function updatePinataKey(e) {
    localStorage.setItem("pinataKey", e.target.value);
    setKeysWereVerified(false);
  }

  function updatePinataSecretKey(e) {
    localStorage.setItem("pinataSecretKey", e.target.value);
    setKeysWereVerified(false);
  }

  const usePersonalKeyDefault =
    localStorage.getItem("usePersonalPinataKey") === "true" ? true : false;

  const [usePersonalPinataKey, setUsePersonalPinataKey] = useState(
    usePersonalKeyDefault
  );

  const forceUpdate = useForceUpdate();

  const updateAccount = (acc) => {
    global.currentAccount = acc;
    localStorage.setItem("currentAccount", JSON.stringify(acc));
    updateWalletBalance();
    forceUpdate();
  };

  const updateUsePersonalPinataKey = (e) => {
    if (usePersonalPinataKey) {
      setUsePersonalPinataKey(false);
      localStorage.setItem("usePersonalPinataKey", false);
    } else {
      setUsePersonalPinataKey(true);
      localStorage.setItem("usePersonalPinataKey", true);
    }
  };

  const updateWalletBalance = async () => {
    setLoadedWalletbalance(false);

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

    try {
      const { data: balance } = await api.query.system.account(
        JSON.parse(localStorage.getItem("currentAccount")).address
      );
      let balanceToShow = balance.free.toHuman();
      let balanceUnit = "";
      if (balanceToShow.slice(-4) === "Unit") {
        balanceUnit = balanceToShow.substring(
          balanceToShow.length - 5,
          balanceToShow.length
        );
        balanceToShow = balanceToShow.substring(0, balanceToShow.length - 5);
      }
      setWalletBalance(balanceToShow);
      setWalletUnit(balanceUnit);
      setLoadedWalletbalance(true);
    } catch (err) {
      console.log("error loading balance: ", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      let cnt = 0;
      while (!isWeb3Injected && cnt < 50) {
        console.log(`web3Injected was false`);
        cnt++;
      }

      await web3Enable("YibanChen"); // Needed for the next call
      const allAccounts = await web3Accounts();
      if (JSON.parse(localStorage.getItem("currentAccount"))) {
        updateWalletBalance();
      }

      setExtensionAccounts(allAccounts);
    };
    fetchData();
    return;
  }, []);

  function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue((value) => value + 1); // update the state to force render
  }

  if (!!!localStorage.getItem("currentAccount")) {
    return <Redirect to="/about"></Redirect>;
  }
  let pinataForm;

  if (usePersonalPinataKey) {
    console.log(
      `usePersonalPinataKey: ${usePersonalPinataKey}, typeof: ${typeof usePersonalPinataKey}`
    );
    pinataForm = (
      <Form>
        <h3>Advanced Settings</h3>

        <br />

        <p>
          Use personal{" "}
          <a
            href="https://app.pinata.cloud/signin"
            target="_blank"
            rel="noreferrer"
          >
            Piñata account
          </a>
        </p>

        <div>
          <Switch
            label="Use personal Piñata account"
            onChange={(e) => updateUsePersonalPinataKey(e)}
            checked={usePersonalPinataKey}
          />
        </div>
        <p className="pinata-warning mt-1">
          {" "}
          This setting only applies to pinning Notes, not Sites
        </p>

        <br />
        <Form.Label>Piñata API Key</Form.Label>

        <Form.Control
          className={authenticatedKeys ? "bigInput" : "bigInput invalid"}
          onChange={(e) => updatePinataKey(e)}
          defaultValue={
            localStorage.getItem("pinataKey") !== ""
              ? localStorage.getItem("pinataKey")
              : ""
          }
          spellCheck={false}
        ></Form.Control>

        <Form.Label>
          <p className="m-1">Piñata Secret API Key</p>
        </Form.Label>
        <Form.Control
          className={authenticatedKeys ? "bigInput" : "bigInput invalid"}
          onChange={(e) => updatePinataSecretKey(e)}
          defaultValue={
            localStorage.getItem("pinataSecretKey") !== ""
              ? localStorage.getItem("pinataSecretKey")
              : ""
          }
          spellCheck={false}
        ></Form.Control>
        <Button
          variant="primary"
          className="btn-sm mt-3"
          onClick={testAuthentication}
        >
          Verify Api Keys
        </Button>
        {authenticatedKeys ? (
          ""
        ) : (
          <p className="bold-text invalid-text mt-2">
            One or both of your Piñata API keys is invalid. Please make sure you
            have pasted them correctly.
          </p>
        )}
        {keysWereVerified ? (
          <p className="bold-text mt-2 green-text">
            Your Piñata API keys have been verified
          </p>
        ) : (
          ""
        )}
      </Form>
    );
  } else {
    pinataForm = (
      <Form>
        <h3>Advanced Settings</h3>
        <br />

        <label>
          <p>
            Use personal{" "}
            <a
              href="https://app.pinata.cloud/signin"
              target="_blank"
              rel="noreferrer"
            >
              Piñata account
            </a>
          </p>
          <Switch
            label="Use personal Piñata account"
            onChange={(e) => updateUsePersonalPinataKey(e)}
            checked={usePersonalPinataKey}
          />
        </label>
      </Form>
    );
  }
  let balanceSlot;

  if (loadedWalletBalance) {
    balanceSlot = (
      <h5 className="m-2">
        {`Balance: \t `}
        <span className="green-text bal-text">{walletBalance.toString()}</span>
        {walletUnit}
      </h5>
    );
  } else {
    balanceSlot = (
      <h5 className="m-2">
        <YibanLoader type="Puff" color="#04A902" size={15} />
      </h5>
    );
  }

  return (
    <div className="centered">
      <div className="centered p-3">
        <h3>Account</h3>
        <Dropdown>
          <Dropdown.Toggle
            variant="primary"
            id="dropdown-basic"
            style={{
              color: "#eeeeee",
              boxShadow: "5px 5px 3px rgba(46, 46, 46, 0.62)",
              backgroundColor: "#0346FF",
              border: "none",
            }}
          >
            <Identicon
              value={JSON.parse(localStorage.getItem("currentAccount")).address}
              size={32}
              theme={"polkadot"}
            />{" "}
            {JSON.parse(localStorage.getItem("currentAccount")).meta.name}
          </Dropdown.Toggle>

          <Dropdown.Menu className="account-dropdown">
            {extensionAccounts.map((account) => (
              <div key={account.address} onClick={() => updateAccount(account)}>
                <Dropdown.Item>
                  <AccountListItem account={account}></AccountListItem>
                </Dropdown.Item>
              </div>
            ))}
          </Dropdown.Menu>
        </Dropdown>
        {balanceSlot}
      </div>
      <div className="centered p-3"></div>
      <br />
      <div className="text-center">{pinataForm}</div>
    </div>
  );
}
