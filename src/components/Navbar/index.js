import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiPromise } from "@polkadot/api";
import wsProvider from "../../util/WsProvider";
import {
  faEnvelope,
  faPen,
  faCog,
  faSitemap,
  faStore,
  faUserCircle,
  faUpload,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import Identicon from "@polkadot/react-identicon";
import YibanLoader from "../YibanLoader";
import "./nav.css";
import logo from "./yibanchenbright.png";

const getAccountPrice = async (setBlockNumber, api) => {
  let unsub;

  let acc = JSON.parse(localStorage.getItem("currentAccount"));

  if (JSON.parse(localStorage.getItem("currentAccount"))) {
    unsub = await api.query.system.number(
      JSON.parse(localStorage.getItem("currentAccount")).number,
      (number) => {
        setBlockNumber(number);
        localStorage.setItem("blockNumber", number);
      }
    );
  }
};

const YibanNavbar = () => {
  let account = "";
  let polkadotApi;
  if (localStorage.getItem("currentAccount") !== "undefined") {
    account = JSON.parse(localStorage.getItem("currentAccount"));
  }
  const [time, setTime] = useState(Date.now());
  const currBlockNumber = localStorage.getItem("blockNumber");
  const [blockNumber, setBlockNumber] = useState(
    currBlockNumber ? parseInt(currBlockNumber) : 0
  );

  const size = {
    height: 55,
    width: 195,
  };

  // this rerenders the component so that it stays updated with the current account. There is probably a better way to do this.
  useEffect(() => {
    async function fetchData() {
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
            owner: "AccountId",
            site_index: "u32",
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

      getAccountPrice(setBlockNumber, api);
    }
    fetchData();

    const interval = setInterval(() => setTime(0), 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Navbar
      className="color-nav"
      expand="lg"
      variant="dark"
      fluid="lg"
      max-width="5px"
      style={{ maxHeight: "94px", bottom: 0 }}
    >
      <Navbar.Brand href="/">
        <img
          style={size}
          src={logo}
          className="d-inline-block align-top ml-5"
          alt="YibanChen logo"
        />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />

      <Nav className="mr-auto">
        <Nav.Link href="/inbox">
          <FontAwesomeIcon icon={faEnvelope} />
        </Nav.Link>
        <Nav.Link href="/compose">
          <FontAwesomeIcon icon={faPen} />
        </Nav.Link>

        <NavDropdown
          title={<FontAwesomeIcon icon={faSitemap} />}
          id="navbarScrollingDropdown"
          variant="dark"
        >
          <NavDropdown.Item
            href="/all-sites"
            title={<FontAwesomeIcon icon={faSitemap} className="mr-1" />}
          >
            <div className="box">
              <h5 className="site-dropdown-text">
                <FontAwesomeIcon icon={faSitemap} className="mr-1" size="sm" />{" "}
                Sites
              </h5>
            </div>
          </NavDropdown.Item>
          <NavDropdown.Item href="/site-marketplace">
            <div className="box">
              <h5 className="site-dropdown-text">
                <FontAwesomeIcon icon={faStore} className="mr-1" size="sm" />{" "}
                Marketplace
              </h5>
            </div>
          </NavDropdown.Item>
          <NavDropdown.Item href="/my-sites">
            <div className="box">
              <FontAwesomeIcon
                icon={faUserCircle}
                className=""
                size="lg"
                style={{ marginTop: "4px" }}
              />
              <h5 className="site-dropdown-text">My Sites</h5>
            </div>
          </NavDropdown.Item>
          <NavDropdown.Item href="/upload">
            <div className="box">
              <FontAwesomeIcon
                style={{ marginTop: "4px" }}
                icon={faUpload}
                size="lg"
              />
              <h5 className="site-dropdown-text">Upload</h5>
            </div>
          </NavDropdown.Item>
        </NavDropdown>
        <Nav.Link href="/settings">
          <FontAwesomeIcon icon={faCog} />
        </Nav.Link>
      </Nav>

      <Nav>
        <div className="block-flex ">
          {localStorage.getItem("currentAccount") ? (
            <div className="block-container mr-4 ">
              <h5 style={{ color: "#eeeeee" }} className=" curr-block-text">
                Current Block
              </h5>
              {blockNumber === 0 ? (
                ""
              ) : (
                <div className="block-num">
                  <h5 style={{ color: "#97F463" }}>
                    <div>
                      <FontAwesomeIcon
                        icon={faCircle}
                        size="xs"
                        className="slight-bottom-margin"
                      />{" "}
                      {parseInt(blockNumber)}
                    </div>
                  </h5>
                </div>
              )}
            </div>
          ) : (
            ""
          )}
          <div className=" mt-1 text-center mr-5">
            <Identicon
              value={
                account !== "undefined" && account !== null
                  ? account.address
                  : ""
              }
              size={48}
              className="mt-2"
              theme={"polkadot"}
            />{" "}
            <Nav.Link href="/settings" className="text-center">
              <h5>{account ? account.meta.name : ""}</h5>
            </Nav.Link>
          </div>
        </div>
      </Nav>

      <Nav></Nav>
    </Navbar>
  );
};

export default YibanNavbar;
