import { React, Component } from "react";
import Button from "react-bootstrap/Button";

class SimpleButton extends Component {
  render() {
    return (
      <div>
        <style type="text/css">
          {`
      .btn-flat {
        background-color: #69ab43;
        color: #eeeeee;
      }


      `}
        </style>
        <Button
          variant="flat"
          size={this.props.buttonSize}
          onClick={this.props.action}
          id={this.props.buttonId}
        >
          {this.props.buttonText}
        </Button>
      </div>
    );
  }
}

export default SimpleButton;
