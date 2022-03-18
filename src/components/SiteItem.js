import React, { useEffect, useState } from "react";
import { Col } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Identicon from "@polkadot/react-identicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

function SiteItem(props) {
  const [imgSrc, setImgSrc] = useState("");

  useEffect(() => {
    // Update the document title using the browser API
  });

  return (
    <Col className="site-box-bigger text-center col-md-offset-2">
      {" "}
      <h4>
        <a
          style={{ color: "#02C5FE", textDecoration: "underline" }}
          href={`https://ipfs.io/ipfs/${props.site["ipfs_cid"]}`}
        >
          {props.site["site_name"]}
        </a>
      </h4>
      <hr className="site-divider" />
      {props.site.owner === props.address ? (
        <FontAwesomeIcon className="toprightcorner" icon={faStar} />
      ) : (
        ""
      )}
      <Identicon value={props.site["owner"]} size={48} theme={"polkadot"} />
      <p className="mb-3 mt-1">price: {props.site["humanPrice"]} </p>
      <Button
        style={{
          color: "#eeeeee",
          boxShadow: "5px 5px 3px rgba(46, 46, 46, 0.62)",
          backgroundColor: "#F19135",
          border: "none",
        }}
        className="btn-md mt-4"
        aria-label="delete"
        onClick={() => props.buySiteFunc(props.site)}
      >
        Buy
      </Button>
    </Col>
  );
}

export default SiteItem;
