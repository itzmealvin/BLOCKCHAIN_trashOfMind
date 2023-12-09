import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import deployedAddress from "../contracts/contract-address.json";
import contractJSON from "../contracts/TrashOfMind.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [myMind, setMyMind] = useState({ mind: "" });
  const [myNonce, setMyNonce] = useState({ nonce: "" });
  const [myThoughts, setMyThoughts] = useState([]);
  const [recentThoughts, setRecentThoughts] = useState([]);
  const [numThoughts, setNumThoughts] = useState();
  const [allNonces, setAllNonces] = useState([]);

  const targetNetworkId = "0x13881";
  const contractAddress = deployedAddress.address;
  const contractABI = contractJSON.abi;

  const checkNetwork = async () => {
    const { ethereum } = window;
    if (!ethereum) return false;

    const currentChainId = await ethereum.request({ method: "eth_chainId" });
    return currentChainId === targetNetworkId;
  };

  const switchNetwork = async () => {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetNetworkId }],
    });
    window.location.reload();
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Metamask is not installed!");
        return;
      }

      if (!checkNetwork()) {
        alert("Please switch to the right network");
        switchNetwork();
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        setCurrentAccount(accounts[0]);
        getStatistics();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Metamask at https://metamask.io/!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const interactWithContract = async (action, callback) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const trashOfMindContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await action(trashOfMindContract);
        await txn.wait();
        callback();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const newThought = () => {
    interactWithContract(
      async (contract) => contract.throwNewMind(myMind.mind),
      () => {
        alert("Throwned! Now forget about it, or censor it later with nonce:");
        getStatistics();
      }
    );
  };

  const deleteThought = () => {
    interactWithContract(
      async (contract) => contract.deleteOldMind(parseInt(myNonce.nonce, 10)),
      () => {
        alert("Deleted! Now forget about it!");
        getStatistics();
      }
    );
  };

  const viewThought = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const trashOfMindContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const minds = await Promise.all([
          trashOfMindContract.viewSpecificMind(myNonce.nonce),
        ]);

        const mindsCleaned = minds.map((mind) => ({
          mind: mind.mind,
          timestamp: new Date(mind.timestamp * 1000),
        }));
        setMyThoughts(mindsCleaned);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatistics = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const trashOfMindContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const [allThoughts, nonces] = await Promise.all([
          trashOfMindContract.viewAllThoughts(),
          trashOfMindContract.viewAllNoncesOfAddress(),
        ]);

        const thoughtsCleaned = allThoughts.map((thought) => ({
          address: thought.sender,
          mind: thought.mind,
          timestamp: new Date(thought.timestamp * 1000),
        }));

        const noncesArray = nonces.map((bigNumber) => bigNumber.toNumber());

        setNumThoughts(thoughtsCleaned.length);
        setRecentThoughts(thoughtsCleaned.slice(-5));
        setAllNonces(noncesArray);
      } else {
        console.error("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">Trash of Mind!</div>
        <div className="bio">
          A place for myself, everyone to throw out the negative minds
        </div>
        <div className="bio">
          {!currentAccount ? (
            <>
              <p>Connect a Web3 wallet to see all the stats.</p>
              <button className="waveButton" onClick={connectWallet}>
                Connect Wallet
              </button>
            </>
          ) : (
            <p>We have {numThoughts} thoughts to-date.</p>
          )}
        </div>
        <textarea
          onChange={(e) => setMyMind({ ...myMind, mind: e.target.value })}
          value={myMind.mind}
          name="mind"
          className="textbox"
          placeholder="Write something negative here..."
        ></textarea>
        <button className="waveButton" onClick={newThought}>
          Throw it out...
        </button>
        {recentThoughts.map((thought, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "OldLace",
              marginTop: "16px",
              padding: "8px",
            }}
          >
            <div>Address: {thought.address}</div>
            <div>Mind: {thought.mind}</div>
            <div>At: {thought.timestamp.toString()}</div>
          </div>
        ))}
        <div className="bio">
          {!currentAccount
            ? ""
            : `You have ${allNonces.length} thoughts to-date`}
        </div>
        <select
          onChange={(e) => setMyNonce({ ...myNonce, nonce: e.target.value })}
          value={myNonce.nonce}
          name="nonce"
          className="textbox"
        >
          <option value="" disabled>
            Select a nonce
          </option>
          {allNonces.map((nonce, index) => (
            <option key={index} value={nonce}>
              {nonce}
            </option>
          ))}
        </select>
        <button className="waveButton" onClick={viewThought}>
          View this thought..
        </button>
        {myThoughts.map((mind, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "OldLace",
              marginTop: "16px",
              padding: "8px",
            }}
          >
            <div>Mind: {mind.mind}</div>
            <div>At: {mind.timestamp.toString()}</div>
          </div>
        ))}
        <button className="waveButton" onClick={deleteThought}>
          Delete your thought..
        </button>
      </div>
    </div>
  );
};

export default App;
