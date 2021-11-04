import * as React from "react";
import Identicon from "@polkadot/react-identicon";

class NoteItem extends React.Component {
  render() {
    if (this.props.active !== this.props.messageObject.pageNumber) {
      return <div></div>;
    }
    return (
      <div
        className={
          this.props.messageToFocus === this.props.messageObject
            ? "noteSection focusedNote m-1"
            : "noteSection m-1"
        }
        onClick={() => this.props.action(this.props.messageObject)}
      >
        <div className="centered">
          <p className="mt-3">{this.props.messageObject.timestamp}</p>
          <Identicon
            value={
              this.props.messageObject.sender
                ? this.props.messageObject.sender.address
                : ""
            }
            size={32}
            theme={"polkadot"}
          />
          <p>
            {this.props.messageObject.sender
              ? `${this.props.messageObject.sender.address.slice(
                  0,
                  6
                )}...${this.props.messageObject.sender.address.slice(42, 48)}`
              : ""}
          </p>
          <br />
          <p>
            {this.props.messageObject.subject.length > 30
              ? `${this.props.messageObject.subject.slice(0, 30)}...`
              : this.props.messageObject.subject}
          </p>
        </div>
      </div>
    );
  }
}

export default NoteItem;
