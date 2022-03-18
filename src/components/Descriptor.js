// A boilerplate React Class Component called Descriptor
import * as React from "react";
import Identicon from "@polkadot/react-identicon";

class Descriptor extends React.Component {
  constructor() {
    super();
    this.state = { showFullAddress: false };
  }

  showMore = () => {
    if (this.state.showFullAddress) {
      this.setState({ showFullAddress: false });
    } else {
      this.setState({ showFullAddress: true });
    }
  };

  render() {
    return (
      <div className="descriptor">
        <Identicon
          value={this.props.address}
          size={this.props.identiconSize}
          theme={"polkadot"}
          className="m-1 mr-2 mb-2 ml-2"
        />{" "}
        <p className="sender-address" onClick={() => this.showMore()}>
          Owner: {"\t"}
          {this.state.showFullAddress === false
            ? `${this.props.address.slice(0, 6)}...${this.props.address.slice(
                42,
                48
              )}`
            : this.props.address}
        </p>
      </div>
    );
  }
}

export default Descriptor;
