import * as React from "react";
import Identicon from "@polkadot/react-identicon";
import wsProvider from "../util/WsProvider";
import {ApiPromise} from "@polkadot/api";

class NoteItem extends React.Component {
    constructor() {
        super();
        this.state = {
            accountNameValue: ''
        };
    }

    async componentDidMount() {

        const api = await ApiPromise.create({
            // Create an API instance
            provider: wsProvider,
            types: {
                ClassId: "u32",
                ClassIdOf: "ClassId",
                TokenId: "u64",
                TokenIdOf: "TokenId",
                TokenInfoOf: {
                    metadata: "CID",
                    owner: "AccountId",
                    data: "TokenData",
                },
                SiteIndex: "u32",
                Site: {
                    ipfs_cid: "Text",
                    site_name: "Text",
                },
                ClassInfoOf: {
                    metadata: "string",
                    totalIssuance: "string",
                    owner: "string",
                    data: "string",
                },
                Note: "Text",
                NoteIndex: "u32",
            },
        })
        let name = await api.query.nameService.nameOf(this.props.messageObject.sender.address);
        if (name.toHuman() !== null) {
            this.setState({accountNameValue: name.toHuman()[0]})
        } else {
            this.setState({accountNameValue: this.props.messageObject.sender.address})
        }
    }

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
                        {this.state.accountNameValue !== this.props.messageObject.sender.address
                            ? this.state.accountNameValue :
                            `${this.state.accountNameValue.slice(
                                0,
                                6
                            )}...${this.state.accountNameValue.slice(42, 48)}`
                        }
                    </p>
                    <br/>
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
