import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPen, faCog } from "@fortawesome/free-solid-svg-icons";
import Identicon from "@polkadot/react-identicon";
import "./nav.css";

const YibanNavbar = () => {
  let account = "";
  if (localStorage.getItem("currentAccount") !== "undefined") {
    account = JSON.parse(localStorage.getItem("currentAccount"));
  }
  const [time, setTime] = useState(Date.now());

  const size = {
    height: 55,
    width: 195,
  };

  // this rerenders the component so that it stays updated with the current account. There is probably a better way to do this.
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Navbar className="color-nav" expand="lg" variant="dark">
      <Container>
        <Navbar.Brand href="/">
          <img
            style={size}
            src="/yibanchenbright.png"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav" aria-label="navbar">
          <Nav className="mr-auto">
            <Nav.Link href="/inbox">
              <FontAwesomeIcon icon={faEnvelope} />
            </Nav.Link>
            <Nav.Link href="/compose">
              <FontAwesomeIcon icon={faPen} />
            </Nav.Link>
            <Nav.Link href="/settings">
              <FontAwesomeIcon icon={faCog} />
            </Nav.Link>
          </Nav>
          <Nav>
            <div className="identicon-center">
              <Identicon
                value={
                  account !== "undefined" && account !== null
                    ? account.address
                    : ""
                }
                size={48}
                theme={"polkadot"}
              />{" "}
              <Nav.Link href="/settings" className="robot">
                {account ? account.meta.name : ""}
              </Nav.Link>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default YibanNavbar;
