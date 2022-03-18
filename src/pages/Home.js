import React from "react";
import ReactTypingEffect from "react-typing-effect";
import logo from "../images/yibanchenbright.png";

import "./style.css";

function Home() {
  return (
    <div>
      <div className="homepage-container white-text">
        <main>
          <img src={logo} alt="YibanChen Logo" className="logo-img mb-4" />
          <h3 className="mb-3 mt-1">
            Decentralized Communication built using Substrate
          </h3>
          <h4 className="green-text mt-4 mb-4 pt-2 pb-2">
            YibanChen:${" "}
            <ReactTypingEffect
              text={[
                "Decentralized Messaging",
                "Decentralized Site Hosting",
                "Building Web 3.0",
                "Connecting to Polkadot",
                "Connecting to Kusama",
              ]}
              cursorRenderer={(cursor) => <h4>{cursor}</h4>}
              speed={50}
              eraseSpeed={75}
              eraseDelay={4000}
              displayTextRenderer={(text, i) => {
                return (
                  <h4>
                    {text.split("").map((char, i) => {
                      const key = `${i}`;
                      return <span key={key}>{char}</span>;
                    })}
                  </h4>
                );
              }}
            />
          </h4>
          <ul className="home-ul">
            <li>
              <a
                href="https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.yibanchen.com%3A443#/explorer"
                target="_blank"
                className="app-link"
                rel="noreferrer"
              >
                Connect To Node Console
              </a>
            </li>
          </ul>
          <ul className="home-ul">
            <li>
              <a
                href="https://docs.yibanchen.com"
                target="_blank"
                className="app-link"
                rel="noreferrer"
              >
                Documentation
              </a>
            </li>
          </ul>
        </main>
      </div>
    </div>
  );
}

export default Home;
