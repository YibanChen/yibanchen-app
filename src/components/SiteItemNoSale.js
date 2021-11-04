import { Col } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import Identicon from "@polkadot/react-identicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button } from "react-bootstrap";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import Descriptor from "./Descriptor";
import DetailView from "./DetailView";

function SiteItemNoSale(props) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const showDetails = (e) => {
    e.preventDefault();

    setShowDetailModal(true);
  };

  const handleClose = () => {
    setShowDetailModal(false);
  };

  return (
    <Col className="site-box-bigger text-center  col-md-offset-2">
      {showDetailModal ? (
        <DetailView
          site={props.site}
          closeFunc={handleClose}
          polkadotApi={props.polkadotApi}
        />
      ) : (
        ""
      )}
      {props.site.owner === props.address ? (
        <FontAwesomeIcon className="toprightcorner" icon={faStar} />
      ) : (
        ""
      )}
      <h4>
        <a
          style={{ color: "#02C5FE", textDecoration: "underline" }}
          href="/#"
          onClick={(e) => showDetails(e)}
        >
          {props.site["site_name"]}
        </a>
      </h4>
      <hr className="site-divider" />
      <Descriptor address={props.site.owner} identiconSize={48} />

      <Button
        style={{
          color: "#eeeeee",
          boxShadow: "5px 5px 3px rgba(46, 46, 46, 0.62)",
          backgroundColor: "#F19135",
          border: "none",
        }}
        className="btn-md mt-4"
        aria-label="delete"
        onClick={(e) => showDetails(e)}
      >
        Details
      </Button>
    </Col>
  );
}

export default SiteItemNoSale;
