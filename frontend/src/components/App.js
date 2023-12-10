import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import truncateEthAddress from "truncate-eth-address";
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
    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    return currentChainId === targetNetworkId;
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetNetworkId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetNetworkId,
              rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
              chainName: "Polygon Mumbai",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
            },
          ],
        });
      }
    }
    window.location.reload();
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Metamask is not installed!");
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
    window.ethereum.on("accountsChanged", function (accounts) {
      window.location.reload();
    });
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

      if (!(await checkNetwork())) {
        alert("Please switch to the right network");
        switchNetwork();
        return;
      }

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const getContract = () => {
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
        return trashOfMindContract;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const newThought = async () => {
    const txn = await getContract().throwNewMind(myMind.mind);
    await txn.wait();
    alert("Thrown! Now forget about it");
    getStatistics();
  };

  const deleteThought = async () => {
    const txn = await getContract().deleteOldMind(parseInt(myNonce.nonce, 10), {
      gasLimit: 100000,
    });
    await txn.wait();
    alert("Deleted! Now really forget about it");
    getStatistics();
  };

  const viewThought = async () => {
    try {
      const minds = await Promise.all([
        getContract().viewSpecificMind(parseInt(myNonce.nonce, 10)),
      ]);

      const mindsCleaned = minds.map((mind) => ({
        mind: mind.mind,
        timestamp: new Date(mind.timestamp * 1000),
      }));
      setMyThoughts(mindsCleaned);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatistics = async () => {
    try {
      const [allThoughts, nonces] = await Promise.all([
        getContract().viewAllThoughts(),
        getContract().viewAllNoncesOfAddress(),
      ]);

      const thoughtsCleaned = allThoughts.map((thought) => ({
        mind: thought.mind,
        timestamp: new Date(thought.timestamp * 1000),
      }));

      const noncesArray = nonces.map((bigNumber) => bigNumber.toNumber());

      setNumThoughts(thoughtsCleaned.length);
      setRecentThoughts(thoughtsCleaned.slice(-5));
      setAllNonces(noncesArray);
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
            <p>
              Hello {truncateEthAddress(currentAccount)}! We have {numThoughts}{" "}
              thoughts to-date.
            </p>
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
