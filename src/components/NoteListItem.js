import React, { useState } from "react";
import { ListGroup } from "react-bootstrap";
import Identicon from "@polkadot/react-identicon";
import "../pages/style.css";
function NoteListItem(props) {
  const [showFullAddress, setShowFullAddress] = useState(false);

  return (
    <ListGroup horizontal variant="dark">
      <ListGroup.Item variant="dark" className="pr-10 content-tab">
        {props.note.subject.length < 40
          ? props.note.subject
          : `${props.note.subject.slice(0, 40)}...`}{" "}
      </ListGroup.Item>
      <ListGroup.Item variant="dark" className="pr-10 content-tab">
        <div className="note-list-sender">
          <div className="mr-1">
            <Identicon
              value={props.note.sender.address}
              size={25}
              theme={"polkadot"}
            />
          </div>
          <p
            className="sender-address"
            onClick={() => setShowFullAddress(!showFullAddress)}
          >
            {showFullAddress === false
              ? `${props.note.sender.address.slice(
                  0,
                  6
                )}...${props.note.sender.address.slice(42, 48)}`
              : props.note.sender.address}
          </p>
        </div>
      </ListGroup.Item>
      <ListGroup.Item variant="dark" className="pr-10 content-tab">
        {props.note.timestamp}
      </ListGroup.Item>
    </ListGroup>
  );
}

export default NoteListItem;
