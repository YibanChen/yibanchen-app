import * as React from "react";
import "../pages/style.css";
import { web3FromSource, web3Enable } from '@polkadot/extension-dapp';

const { u8aToHex, u8aWrapBytes } = require("@polkadot/util");
class ChatBot extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            botMess: '',
            signature: '',
        }
    }
    onMassegeInput = (e) => {
        this.setState({ botMess: e.target.value })
    }

    onSign = async (e) => {
        e.preventDefault();
        const account = JSON.parse(localStorage.getItem("currentAccount"));
        await web3Enable('test')
        const injector = await web3FromSource(account.meta.source);
        const signRaw = injector?.signer?.signRaw;
        const wrapped = u8aWrapBytes(this.state.botMess);
        if (!!signRaw) {

            await signRaw({
                address: account.address,
                data: u8aToHex(wrapped),
                type: 'bytes'
            }).then(({ signature }) => {
                this.setState({ signature })
            })
        }
    }

    render() {

        return (<>
            <div className='sign'>
                <form className='sign-form'>
                    <div className='sign-form__events'>
                        <input type="text" id='sign-form__input' placeholder='Input text from bot...' value={this.state.botMess} onChange={this.onMassegeInput} />
                        <button onClick={this.onSign}>Sign</button>
                    </div>
                    <div className='sign-form__signature'>
                        {
                            this.state.signature !== '' ?
                                <>
                                    <p>Copy and paste this string to the bot:</p>
                                    <p>{`${this.state.signature}`}</p>
                                </>
                                : ''
                        }
                    </div>
                </form>
            </div>
        </>
        )
    }
}

export default React.memo(ChatBot)