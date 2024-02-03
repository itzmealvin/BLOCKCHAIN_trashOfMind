import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import truncateEthAddress from "truncate-eth-address";
import "./App.css";
import deployedAddress from "../contracts/contract-address.json";
import contractJSON from "../contracts/TrashOfMind.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [myMsg, setMyMsg] = useState({ mind: "" });
  const [selectedNonce, setselectedNonce] = useState({ nonce: "" });
  const [selectedMind, setSelectedMind] = useState([]);
  const [recentMinds, setRecentMinds] = useState([]);
  const [numOfMinds, setNumOfMinds] = useState();
  const [myNonces, setMyNonces] = useState([]);

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
  };

  const handleNetworkCheck = async () => {
    if (!(await checkNetwork())) {
      alert("Please switch to the right network");
      await switchNetwork();
      return false;
    }
    return true;
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
        await loadAllMindsFn();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        checkIfWalletIsConnected();

        window.ethereum.on("accountsChanged", function () {
          window.location.reload();
        });
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };
    fetchData();
  }, []);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Metamask at https://metamask.io/!");
        return;
      }
      await handleNetworkCheck();
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      window.location.reload();
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
        return new ethers.Contract(contractAddress, contractABI, signer);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const throwNewMindFn = async () => {
    await handleNetworkCheck();
    const txn = await getContract().throwNewMind(myMsg.msg);
    await txn.wait();
    alert("Thrown! Now forget about it");
    await loadAllMindsFn();
  };

  const deleteCurrentMindFn = async () => {
    await handleNetworkCheck();
    const txn = await getContract().deleteCurrentMind(
      parseInt(selectedNonce.nonce, 10),
      {
        gasLimit: 100000,
      }
    );
    await txn.wait();
    alert("Deleted! Now really forget about it");
    await loadAllMindsFn();
  };

  const viewMindFn = async () => {
    try {
      const mind = await Promise.all([
        getContract().viewMind(parseInt(selectedNonce.nonce, 10)),
      ]);

      const mindCleaned = mind.map((mind) => ({
        msg: mind.message,
        timestamp: new Date(mind.timestamp * 1000),
      }));
      setSelectedMind(mindCleaned);
    } catch (error) {
      console.error(error);
    }
  };

  const loadAllMindsFn = async () => {
    await handleNetworkCheck();
    try {
      const [allMinds, nonces] = await Promise.all([
        getContract().viewAllMinds(),
        getContract().viewmyNoncesOf(),
      ]);

      const mindsCleaned = allMinds.map((minds) => ({
        msg: minds.message,
        timestamp: new Date(minds.timestamp * 1000),
      }));

      const noncesArray = nonces.map((bigNumber) => bigNumber.toNumber());

      setNumOfMinds(mindsCleaned.length);
      setRecentMinds(mindsCleaned.slice(-5).reverse());
      setMyNonces(noncesArray);
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
              Hello {truncateEthAddress(currentAccount)}! We have {numOfMinds}{" "}
              thoughts to-date.
            </p>
          )}
        </div>
        <textarea
          onChange={(e) => setMyMsg({ ...myMsg, msg: e.target.value })}
          value={myMsg.msg}
          name="mind"
          className="textbox"
          placeholder="Write something negative here..."
        ></textarea>
        <button className="waveButton" onClick={throwNewMindFn}>
          Throw it out...
        </button>
        {recentMinds.map((minds, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "OldLace",
              marginTop: "16px",
              padding: "8px",
            }}
          >
            <div>Message: {minds.msg}</div>
            <div>At: {minds.timestamp.toString()}</div>
          </div>
        ))}
        <div className="bio">
          {!currentAccount
            ? ""
            : `You have ${myNonces.length} thoughts to-date`}
        </div>
        <select
          onChange={(e) =>
            setselectedNonce({ ...selectedNonce, nonce: e.target.value })
          }
          value={selectedNonce.nonce}
          name="nonce"
          className="textbox"
        >
          <option value="" disabled>
            Select a nonce
          </option>
          {myNonces.map((nonce, index) => (
            <option key={index} value={nonce}>
              {nonce}
            </option>
          ))}
        </select>
        <button className="waveButton" onClick={viewMindFn}>
          View this thought..
        </button>
        {selectedMind.map((mind, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "OldLace",
              marginTop: "16px",
              padding: "8px",
            }}
          >
            <div>Message: {mind.msg}</div>
            <div>At: {mind.timestamp.toString()}</div>
          </div>
        ))}
        <button className="waveButton" onClick={deleteCurrentMindFn}>
          Delete your thought..
        </button>
        <div className="bio">
          Support my work: 0x24B00B5987Ae6A5b7a8c73671332b938433fA7D9.
        </div>
        <a
          href="https://blog-betterday.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="bio"
        >
          Want some healing?
        </a>
      </div>
    </div>
  );
};

export default App;
