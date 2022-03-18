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
    isWeb3Injected, web3FromSource,
} from "@polkadot/extension-dapp";
import { ApiPromise } from "@polkadot/api";
import axios from "axios";
import wsProvider from "../util/WsProvider";
import ChatBot from "../components/ChatBot";

export default function SettingsScreen({ navigation }) {
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletUnit, setWalletUnit] = useState("");
    const [loadedWalletBalance, setLoadedWalletbalance] = useState(false);
    const [extensionAccounts, setExtensionAccounts] = useState([]);
    const [authenticatedKeys, setAuthenticatedKeys] = useState(true);
    const [keysWereVerified, setKeysWereVerified] = useState(false);
    const [accountName, setAccountName] = useState("");
    const [accountNameValue, setAccountNameValue] = useState("");
    const [buttonValue, setButtonValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [nameLoading, setnameLoading] = useState(false);

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

    //Name service

    let apiConnection = async function () {
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
        return api
    }

    let handleNameChange = function ({ target: { value } }) {
        setAccountName(value)
    }

    let setName = async function () {
        if (nameLoading === false && walletBalance > 1) {
            setnameLoading(true)
            if (accountName.length > 6) {
                if (document.querySelector('.account-name-validate').style.display === "block") {
                    document.querySelector('.account-name__input').classList.remove('password-validate')
                    document.querySelector('.account-name-validate').style.display = "none"
                }
                const account = JSON.parse(localStorage.getItem("currentAccount"));
                const injector = await web3FromSource(account.meta.source);
                const api = await apiConnection()
                setLoading(true)
                const accountAddress = account.address
                const transfer = api.tx.nameService.setName(accountName)
                const hash = await transfer.signAndSend(accountAddress, { signer: injector.signer });
                console.log('tx hash', hash.toHex());
                setLoading(false)
                setAccountNameValue(accountName)
                await updateWalletBalance()
                setValidationMessage('Your address name has successfully changed. You have been charged 1 token, with a balance of ' + walletBalance.toString() + ' tokens in your wallet. ')
                document.querySelector('.account-name-validation').style.display = "block"
                document.querySelector('.account-name__input').classList.add('account-name__input_green')
            } else {
                document.querySelector('.account-name__input').focus()
                document.querySelector('.account-name__input').classList.add('password-validate')
                document.querySelector('.account-name-validate').style.display = "block"
                document.querySelector('.account-name-validation').style.display = "none"
            }
            setnameLoading(false)
        }
    }

    let clearName = async function () {
        if (nameLoading === false) {
            setnameLoading(true)
            const account = JSON.parse(localStorage.getItem("currentAccount"));
            const injector = await web3FromSource(account.meta.source);
            const api = await apiConnection()
            setLoading(true)
            const accountAddress = account.address
            const transfer = api.tx.nameService.clearName();
            const hash = await transfer.signAndSend(accountAddress, { signer: injector.signer });
            console.log('tx hash', hash.toHex());
            setLoading(false)
            await updateWalletBalance()
            document.querySelector('.account-name__input').value = account.address
            setAccountNameValue(account.address)
            setValidationMessage('You have successfully cleared your name. 1 token has been issued back to your wallet.')
            document.querySelector('.account-name__input').classList.add('account-name__input_green')
            setnameLoading(false)
        }
    }

    let getAccountName = async function () {
        const api = await apiConnection()
        let name = await api.query.nameService.nameOf(JSON.parse(localStorage.getItem("currentAccount")).address);
        if (name.toHuman() !== null) {
            setAccountNameValue(name.toHuman()[0])
            setValidationMessage('Your current name. If you wish to remove your name and create a new name, click on clear button, 1 token will be issued back to your wallet.')
        } else {
            setAccountNameValue(JSON.parse(localStorage.getItem("currentAccount")).address)
            setValidationMessage('If you wish to change Polkadot’s wallet address syntax for something easier to remeber for recipients. 1 toke will be charged then issued back.')
        }
        if (accountNameValue !== JSON.parse(localStorage.getItem("currentAccount")).address) {
        } else {
        }
    }()


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
                <div className="name-service">
                    <div className="account-name__text">
                        Choose a New Note’s Address Name
                    </div>
                    <div className="account-name__input-block">
                        <input onChange={handleNameChange} defaultValue={accountNameValue}
                            className="account-name__input" type="text" />
                        <div
                            className="account-name-validation">
                            {validationMessage}
                        </div>
                        <div className='account-name-validate'>This name is currently not available. Please choose
                            another.
                        </div>
                    </div>
                    <div className="account-name-btns">
                        <button onClick={clearName} className="btn btn-flat btn-lg account-info__btn btn-clear">Clear Name</button>
                        <button onClick={setName} className="btn btn-flat btn-lg account-info__btn btn_set">Set Name</button>
                    </div>
                </div>
            </div>
            <div className="centered p-3"></div>
            <br />
            <div className="text-center">{pinataForm}</div>

            <ChatBot />
        </div>
    );
}
