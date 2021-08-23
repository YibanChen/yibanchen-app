import { React, Component } from "react";
import Button from "react-bootstrap/Button";
class SimpleButton extends Component {
  render() {
    return (
      <div>
        <style type="text/css">
          {`
      .btn-flat {
        background-color: #11566F;
        color: #eeeeee;
      }


      `}
        </style>
        <Button
          variant="flat"
          buttonSize={this.props.buttonSize}
          onClick={this.props.action}
        >
          {this.props.buttonText}
        </Button>
      </div>
    );
  }
}

export default SimpleButton;
