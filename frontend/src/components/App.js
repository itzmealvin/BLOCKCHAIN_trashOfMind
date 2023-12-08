import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import "./App.css";
import deployedAddress from "../contracts/contract-address.json";
import contractJSON from "../contracts/TrashOfMind.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [myMind, setMyMind] = useState({ mind: "" });
  const [allThoughts, setAllThoughts] = useState([]);
  const contractAddress = deployedAddress.address;
  const contractABI = contractJSON.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Metamask is not installed!");
      }
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
      } else {
        alert("No authorized accounts found!");
      }
      getAllThoughts();
    } catch (error) {
      console.log(error);
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
      console.log(error);
    }
  };

  const newThought = async () => {
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
        console.log(typeof myMind.mind);
        const newThrownTxn = await trashOfMindContract.throwNewMind(
          myMind.mind
        );
        alert("Throwing mind...", newThrownTxn.hash);
        await newThrownTxn.wait();
        alert(
          "Throwned! Now forget about it, or censored it later with nonce:",
          newThrownTxn
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllThoughts = async () => {
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

        const thoughts = await trashOfMindContract.viewAllThoughts();

        let thoughtsCleaned = [];
        thoughts.forEach((thought) => {
          thoughtsCleaned.push({
            address: thought.sender,
            mind: thought.mind,
            timestamp: new Date(thought.timestamp * 1000),
          });
        });
        setAllThoughts(thoughtsCleaned);
        console.log(thoughtsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">Trash of Mind!</div>
        <div className="bio">
          A place for myself, everyone to throw out the negative minds
        </div>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <textarea
          onChange={(e) => setMyMind({ ...myMind, mind: e.target.value })}
          value={myMind.mind}
          name="mind"
          id="mind"
        ></textarea>
        <button className="waveButton" onClick={newThought}>
          Throw it out...
        </button>
        {allThoughts.map((thought, index) => {
          return (
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
          );
        })}
      </div>
    </div>
  );
}
