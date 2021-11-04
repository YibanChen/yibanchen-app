import { Col } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import Identicon from "@polkadot/react-identicon";
import Loader from "react-loader-spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button } from "react-bootstrap";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import Descriptor from "./Descriptor";
import YibanLoader from "./YibanLoader";

function DetailView(props) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const [sitePrice, setSitePrice] = useState(-1);

  useEffect(() => {
    async function getPrice() {
      const price = await props.polkadotApi.query.site.sitePrices(
        props.site.siteId
      );
      setSitePrice(price.toHuman());
    }
    getPrice();
  }, [props.polkadotApi.query.site, props.site.siteId]);

  const loadIframe = () => {
    setIframeLoaded(true);
  };

  return (
    <Modal
      onHide={() => setShowModal(false)}
      className="white-text detail-modal"
      show={showModal}
      backdrop={"static"}
    >
      <Modal.Header>
        <Modal.Title>
          {props.site.ipfs_cid !== "" ? (
            <h4 className="white-text">{props.site.site_name}</h4>
          ) : (
            <h1> Error loading site </h1>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="site-box-detail">
        {props.site.owner === props.address ? (
          <FontAwesomeIcon className="toprightcorner" icon={faStar} />
        ) : (
          ""
        )}

        <Descriptor address={props.site.owner} identiconSize={48} />
        <p>
          {" "}
          Price: {sitePrice && sitePrice !== -1 ? sitePrice : "Not For Sale"}
        </p>
        <hr className="site-divider" />

        {props.site.ipfs_cid ? (
          <div className="centered">
            {!iframeLoaded ? (
              <Loader
                className="detail-loader centered"
                type="Puff"
                color="#02C3FC"
                height={100}
                width={100}
              />
            ) : null}
            <iframe
              id="mysite-iframe"
              title="mysite-iframe"
              width="250"
              height="175"
              className="detail-frame centered mr-1"
              onLoad={() => setIframeLoaded(true)}
              src={`https://ipfs.io/ipfs/${props.site.ipfs_cid}`}
            ></iframe>

            <a
              className="mt-2"
              style={{ color: "#F19135" }}
              href={`https://ipfs.io/ipfs/${props.site["ipfs_cid"]}`}
              target="_blank"
              rel="noreferrer"
            >
              Visit
            </a>
          </div>
        ) : (
          ""
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.closeFunc}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DetailView;
