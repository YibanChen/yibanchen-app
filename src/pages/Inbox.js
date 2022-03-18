import React, { Component } from "react";
import Alert from "react-bootstrap/Alert";
import { Pagination, ListGroup } from "react-bootstrap";
import { ApiPromise } from "@polkadot/api";
import axios from "axios";
import { format, formatDistance } from "date-fns";
import wsProvider from "../util/WsProvider";
import NoteItem from "../components/NoteItem";
import NoteDetails from "../components/NoteDetails";
import YibanLoader from "../components/YibanLoader";
import Identicon from "@polkadot/react-identicon";
import NoteListItem from "../components/NoteListItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import { faTrash, faReply } from "@fortawesome/free-solid-svg-icons";
import RemoteTable from '../components/RemoteTable';

import PerfectScrollbar from 'react-perfect-scrollbar';
import { textFilter } from 'react-bootstrap-table2-filter';
import "./style.css";

function convertUTCDateToLocalDate(date) {
    var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate;
}

function EmptyList() {
    return (
        <div className="centered no-messages">
            <p>No messages found</p>
        </div>
    );
}

export default class Notes extends Component {
    constructor(props) {
        super(props);
        this.focusNote = this.focusNote.bind(this);
        this.removeFromNotes = this.removeFromNotes.bind(this);
        this.notesPerPage = 1000;

        this.state = {
            active: 0,
            notes: [],
            loading: true,
            error: false,
            errorMessage: "",
            focusedNote: "",
            ipfsTimeouts: 0,
            showFullAddress: false,
        };

        this.columns = [
            {
                dataField: 'subject',
                text: 'Subject',
                sort: false,
                filter: textFilter(),
            },
            {
                dataField: 'sender.address',
                text: 'sender',
                sort: false,
                align: 'center',
                filter: textFilter(),
            },
            {
                dataField: 'timestamp',
                text: 'Date',
                sort: true,
                align: 'center',
            },
            {
                dataField: 'actions',
                isDummyField: true,
                align: 'center',
                // text: 'Actions',
                style: {
                    width: '100px',
                    maxWidth: '100px'
                },
                formatter: (cellContent, row) => {
                    return (
                        <div>
                            <div className='d-block w-100 text-center'>
                                <Button
                                    variant="secondary"
                                    className="btn-primary btn-sm m-2 mt-3 "
                                    aria-label="reply"
                                // onClick={this.setDisplayComposeModal}
                                >
                                    <FontAwesomeIcon icon={faReply} />
                                </Button>
                                <Button
                                    variant="danger"
                                    className="btn-primary btn-sm m-2 mt-3"
                                    aria-label="delete"
                                // onClick={() => this.deleteMessage(this.props.messageToFocus)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </div>
                        </div>
                    );
                },
            },
        ];
    }

    showMore = () => {
        this.setState({ showFullAddress: !this.state.showFullAddress });
    };

    focusNote(mes) {
        this.setState({
            focusedNote: mes,
        });
    }

    removeFromNotes(note) {
        const newNotes = this.state.notes.filter((obj) => {
            return obj.noteId !== note;
        });
        this.setState({
            notes: newNotes,
            notesToDisplay: newNotes,
        });
        this.setState({
            focusedNote: this.state.notesToDisplay[0]
                ? this.state.notesToDisplay[0]
                : "",
        });
        this.filterNotes(this.state.searchTerm);
    }

    async loadNoteHashes() {
        const account = JSON.parse(localStorage.getItem("currentAccount"));

        try {
            if (global.currentAccount === "") {
                throw Error("No wallet global.address found!");
            }
            let hashes = [];
            let then0 = new Date();

            const allEntries = await this.polkadotApi.query.note.notes.entries(
                account.address
            );
            let now0 = new Date();

            allEntries.forEach(
                ([
                    {
                        args: [acc, index],
                    },
                    note,
                ]) => {
                    hashes.push({ hash: note.toHuman(), noteId: index });
                }
            );

            return hashes;
        } catch (err) {
            console.log("error: ", err);
            this.setState({ error: true });
            if (global.addr === "") {
                this.setState({
                    errorMessage:
                        "No wallet found! Please enter your wallet global.address in Settings.",
                });
            } else {
                this.setState({
                    errorMessage:
                        "There was an error retrieving your notes. Please make sure you have pasted your wallet global.address correctly.",
                });
            }
            console.log(err);
        }
    }

    loadNotes = async () => {
        global.secret = localStorage.getItem("secretKey") || "";
        try {
            this.setState({ loading: true, error: false });
            let hashes = await this.loadNoteHashes(); // Load the hashes of the notes
            let ipfsNotes = [];

            // for (var i = 0 ; i < 100; i ++) {
            //   ipfsNotes.push({
            //     message: 'message' + i,
            //     timestamp:format(new Date(), "LLLL dd yyyy hh:mm aaaaa'm'"),
            //     time_distance: 0,
            //     noteId: Number(i),
            //     sender: {address: 'sender' + i},
            //     subject: 'subject' + i,
            //     pageNumber: Math.floor(i / this.notesPerPage),
            //     id: i
            //   });
            // }

            for (const [i, h] of hashes.entries()) {
                let hashAsString = JSON.stringify(h.hash); // API returns an object, so convert to string
                hashAsString = hashAsString.substring(1, hashAsString.length - 1); // The hashes are returned with quotes as part of the hash, so the quotes need to be removed
                if (hashAsString === "" || hashAsString === "ul") {
                    console.log("bad hash found");
                    continue;
                }
                await axios // Query IPFS with the hash

                    .get(`https://yc.mypinata.cloud/ipfs/${hashAsString}`, {
                        timeout: 2000,
                    })
                    .then((response) => {
                        let message = response.data.note;
                        let n = new Date(response.data.timestamp);
                        let m = convertUTCDateToLocalDate(n);
                        let sender = response.data.sender;
                        let subject = response.data.subject;

                        const timestamp = format(n, "LLLL dd yyyy hh:mm aaaaa'm'");
                        const distance = formatDistance(n, new Date(), {
                            includeSeconds: true,
                            addSuffix: true,
                        });

                        ipfsNotes.push({
                            message: message,
                            timestamp: timestamp,
                            time_distance: distance,
                            noteId: Number(h.noteId),
                            sender: sender,
                            subject: subject,
                            pageNumber: Math.floor(i / this.notesPerPage),
                        });
                    })
                    .catch(function (error) {
                        console.log("AXIOS ERROR");
                        console.log(error.message);
                        console.log("hash that couldn't be loaded: ", hashAsString);
                        if (error.message === "timeout of 2000ms exceeded") {
                            console.log(
                                `if you are seeing this, it means that the note you tried to access
                 is not available from IPFS yet. try again in a few minutes.`
                            );
                            console.log("hash that caused the timeout:", hashAsString);
                            this.setState({ ipfsTimeouts: this.state.ipfsTimeouts + 1 });
                        }
                    });
            }

            // sort notes chronologically

            ipfsNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            console.log(ipfsNotes)
            this.setState({
                notes: ipfsNotes,
                notesToDisplay: ipfsNotes,
                loading: false,
                focusedNote: ipfsNotes[0],
            });
        } catch (err) {
            console.log("THERE WAS AN ERROR in loadNotes");
            console.log("err: ", err);
        }
    };

    searchNotes(searchTerm) {
        this.setState({ searchTerm: searchTerm });
        this.filterNotes(searchTerm);
    }

    filterNotes(searchTerm) {
        const term = searchTerm.toLowerCase();

        const newNotes = this.state.notes.filter(
            (note) =>
                note.message.toLowerCase().includes(term) ||
                note.sender.address.toLowerCase().includes(term) ||
                note.subject.toLowerCase().includes(term)
        );
        this.setState({ notesToDisplay: newNotes });
    }

    async componentDidMount() {
        // Redirect if no account selected
        if (
            !JSON.parse(localStorage.getItem("currentAccount")) &&
            process.env.NODE_ENV !== "test"
        ) {
            this.props.history.push("/about");
            return;
        }
        // variables then and now are used to benchmark the inbox loading time
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
        });
        this.polkadotApi = api;
        const ADDR = JSON.parse(localStorage.getItem("currentAccount")).address;
        // this.unsub = await this.polkadotApi.query.note.notes.entries(
        //   ADDR,
        //   (info) => {
        //     for (const i of info) {
        //     }
        //   }
        // );

        let then = new Date();
        await this.loadNotes();
        let now = new Date();

        console.log("time taken to load inbox: ", now - then, "ms");
    }

    setActive(num) {
        console.log(`num: ${num}`);
        this.setState({ active: num });
    }

    old_render() {
        if (this.state.error) {
            return (
                <div className="centered">
                    <p>{this.state.errorMessage}</p>
                </div>
            );
        } else {
            if (this.state.loading) {
                return (
                    <div>
                        {this.state.ipfsTimeouts > 2 ? (
                            <Alert variant="info">
                                IPFS connection issues, please wait...
                            </Alert>
                        ) : (
                            ""
                        )}
                        <div className="centered m-4 p-1">
                            <YibanLoader
                                type="Puff"
                                color="#02C3FC"
                                height={200}
                                width={200}
                            />

                            <h1 className="m-4 text-center">Loading Messages</h1>
                        </div>
                    </div>
                );
            } else {
                // pagination stuff
                let active = 0;
                let pageNumbers = [];
                for (
                    let number = 0;
                    number <= this.state.notesToDisplay.length;
                    number = number + this.notesPerPage
                ) {
                    pageNumbers.push(
                        <Pagination.Item
                            key={number}
                            active={
                                Math.floor(number / this.notesPerPage) === this.state.active
                            }
                            onClick={() =>
                                this.setActive(Math.floor(number / this.notesPerPage))
                            }
                        >
                            {Math.floor(number / this.notesPerPage) + 1}
                        </Pagination.Item>
                    );
                }
                return (
                    <div id="parent">
                        <div className="narrow">
                            <div className="searchbar-div centered mb-1 mt-2 pb-1">
                                <input
                                    className="verySmallInput"
                                    onChange={(e) => this.searchNotes(e.target.value)}
                                    placeholder={"Search Messages"}
                                ></input>
                            </div>
                            <div
                                className={
                                    this.state.notesToDisplay.length > this.notesPerPage
                                        ? "notes-list-adjusted"
                                        : "notes-list"
                                }
                            >
                                {this.state.notesToDisplay.length !== 0 ? (
                                    this.state.notesToDisplay.map(function (d, idx) {
                                        return (
                                            <NoteItem
                                                messageToFocus={this.state.focusedNote}
                                                active={this.state.active}
                                                action={this.focusNote}
                                                key={idx}
                                                messageObject={d}
                                            ></NoteItem>
                                        );
                                    }, this)
                                ) : (
                                    <EmptyList></EmptyList>
                                )}
                            </div>
                            {this.state.notesToDisplay.length > this.notesPerPage ? (
                                <div className="centered">
                                    <Pagination>{pageNumbers}</Pagination>
                                </div>
                            ) : (
                                <div></div>
                            )}
                        </div>
                        <div id="wide">
                            <NoteDetails
                                messageToFocus={this.state.focusedNote}
                                removeFromNotes={this.removeFromNotes}
                                polkadotApi={this.polkadotApi}
                            />
                        </div>
                    </div>
                );
            }
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="centered">
                    <p>{this.state.errorMessage}</p>
                </div>
            );
        }
        if (this.state.loading) {
            return (
                <div>
                    {this.state.ipfsTimeouts > 2 ? (
                        <Alert variant="info">IPFS connection issues, please wait...</Alert>
                    ) : (
                        ""
                    )}
                    <div className="centered m-4 p-1">
                        <YibanLoader type="Puff" color="#02C3FC" height={200} width={200} />
                        <h1 className="m-4 text-center">Loading Messages</h1>
                    </div>
                </div>
            );
        }

        if (this.state.notesToDisplay.length === 0) {
            return (
                <div>
                    <div className="centered m-4 p-1">
                        <h1 className="m-4 text-center">There is no message</h1>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div className='table-responsive'>
                    {(<PerfectScrollbar>
                        <RemoteTable
                            data={this.state.notesToDisplay}
                            columns={this.columns}
                            length={this.state.notesToDisplay.length}
                            sort={[{ dataField: 'timestamp', order: 'asc' }]}
                        />
                    </PerfectScrollbar>)}
                </div>
                <div id="wide">
                    <NoteDetails
                        messageToFocus={this.state.focusedNote}
                        removeFromNotes={this.removeFromNotes}
                        polkadotApi={this.polkadotApi}
                    />
                </div>
            </div>
            // <div className="centered scrollable-notes">
            //   <ListGroup horizontal variant="dark" className="bold-text">
            //     <ListGroup.Item variant="dark" className="pr-10 header-tab">
            //       Subject
            //     </ListGroup.Item>
            //     <ListGroup.Item variant="dark" className="pr-10 header-tab">
            //       Sender
            //     </ListGroup.Item>
            //     <ListGroup.Item variant="dark" className="pr-10 header-tab">
            //       Date
            //     </ListGroup.Item>
            //   </ListGroup>
            //   {this.state.notesToDisplay.map(function (note, idx) {
            //     return (
            //       <div>
            //       <div>
            //         <NoteListItem note={note}></NoteListItem>
            //         </div>
            //         <div id="wide">
            //         <NoteDetails
            //           messageToFocus={this.state.focusedNote}
            //           removeFromNotes={this.removeFromNotes}
            //           polkadotApi={this.polkadotApi}
            //         />
            //         </div>
            //         </div>
            //     );
            //   }, this)}
            // </div>
        );
    }
}
