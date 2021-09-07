import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import { Dropdown, Form } from "react-bootstrap";
import Switch from "react-switch";
import Loader from "react-loader-spinner";
import Identicon from "@polkadot/react-identicon";
import AccountListItem from "../components/AccountListItem";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { ApiPromise } from "@polkadot/api";
import wsProvider from "../util/WsProvider";
// Not currently using any encryption so this function is unused
/* function updateSecretKey(e) {
  global.secret = e.target.value;
  localStorage.setItem("secretKey", e.target.value);
} */

function updatePinataKey(e) {
  localStorage.setItem("pinataKey", e.target.value);
}

function updatePinataSecretKey(e) {
  localStorage.setItem("pinataSecretKey", e.target.value);
}

export default function SettingsScreen({ navigation }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadedWalletBalance, setLoadedWalletbalance] = useState(false);
  const [extensionAccounts, setExtensionAccounts] = useState([]);

  const usePersonalKeyDefault =
    localStorage.getItem("usePersonalPinataKey") === "true"
      ? localStorage.getItem("usePersonalPinataKey")
      : false;

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
    const { nonce, data: balance } = await api.query.system.account(
      JSON.parse(localStorage.getItem("currentAccount")).address
    );
    console.log("balance info: ", balance.free.toHuman());
    setWalletBalance(balance.free.toHuman());
    setLoadedWalletbalance(true);
  };

  const fetchData = async () => {
    const extensions = await web3Enable("YibanChen"); // Needed for the next call
    const allAccounts = await web3Accounts();
    if (JSON.parse(localStorage.getItem("currentAccount"))) {
      updateWalletBalance();
    }

    setExtensionAccounts(allAccounts);
  };

  useEffect(() => {
    const fetchData = async () => {
      const extensions = await web3Enable("YibanChen"); // Needed for the next call
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
    return <Redirect to="/"></Redirect>;
  }
  let pinataForm;

  if (usePersonalPinataKey) {
    pinataForm = (
      <Form>
        <h3>Advanced Settings</h3>
        <br />

        <p>Use personal Piñata account</p>
        <Switch
          label="Use personal Piñata account"
          onChange={(e) => updateUsePersonalPinataKey(e)}
          checked={!!usePersonalPinataKey}
        />
        <br />
        <Form.Label>Piñata Key</Form.Label>

        <Form.Control
          className="messageInput"
          onChange={(e) => updatePinataKey(e)}
          defaultValue={
            localStorage.getItem("pinataKey") !== ""
              ? localStorage.getItem("pinataKey")
              : ""
          }
          spellCheck={false}
        ></Form.Control>

        <Form.Label>
          <p className="m-1">Piñata Secret Key</p>
        </Form.Label>
        <Form.Control
          className="messageInput"
          onChange={(e) => updatePinataSecretKey(e)}
          defaultValue={
            localStorage.getItem("pinataSecretKey") !== ""
              ? localStorage.getItem("pinataSecretKey")
              : ""
          }
          spellCheck={false}
        ></Form.Control>
      </Form>
    );
  } else {
    pinataForm = (
      <Form>
        <h3>Advanced Settings</h3>
        <br />

        <label>
          <p>Use personal Piñata account</p>
          <Switch
            label="Use personal Piñata account"
            onChange={(e) => updateUsePersonalPinataKey(e)}
            checked={!!usePersonalPinataKey}
          />
        </label>
      </Form>
    );
  }
  let balanceSlot;

  if (loadedWalletBalance) {
    balanceSlot = <h5 className="m-2">Balance: {walletBalance.toString()}</h5>;
  } else {
    balanceSlot = (
      <h5 className="m-2">
        <Loader type="Puff" color="#04A902" height={20} width={20} />
      </h5>
    );
  }

  return (
    <div className="centered">
      <div className="centered p-3">
        <h3>Account</h3>
        <Dropdown>
          <Dropdown.Toggle variant="primary" id="dropdown-basic">
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
      <div>{pinataForm}</div>
    </div>
  );
}
