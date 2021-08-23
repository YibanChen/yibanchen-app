import React, { Component } from "react";
import Identicon from "@polkadot/react-identicon";

class AccountListItem extends Component {
  render() {
    return (
      <li className="m-2" key={this.props.account.address.toString()}>
        <div className="m-4">
          <Identicon
            className="my-class"
            value={this.props.account.address}
            size={32}
            theme={"polkadot"}
          />
          <span> </span>
          {this.props.account.meta.name}
        </div>
      </li>
    );
  }
}

export default AccountListItem;
