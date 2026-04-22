import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

const WalletContext = createContext(null);

const AMOY_CHAIN_ID = "0x13882";

export function WalletProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(currentChainId);
    return currentChainId === AMOY_CHAIN_ID;
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: AMOY_CHAIN_ID,
              chainName: "Polygon Amoy Testnet",
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              rpcUrls: ["https://rpc-amoy.polygon.technology/"],
              blockExplorerUrls: ["https://amoy.polygonscan.com/"],
            }],
          });
          return true;
        } catch (addError) {
          console.error("Could not add network", addError);
        }
      }
      return false;
    }
  }, []);

  const connectWallet = useCallback(async (silent = false) => {
    if (!window.ethereum) {
      if (!silent) alert("MetaMask is not installed! Please install MetaMask to connect your wallet.");
      return null;
    }
    try {
      setConnecting(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      setWalletAddress(address);
      localStorage.setItem("walletConnected", "true");

      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        await switchNetwork();
      }

      return address;
    } catch (err) {
      if (err.code === 4001) {
        console.log("User rejected connection");
      } else {
        console.error("Wallet connection error:", err);
      }
      return null;
    } finally {
      setConnecting(false);
    }
  }, [checkNetwork, switchNetwork]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    localStorage.removeItem("walletConnected");
  }, []);

  // Auto-connect and Listeners
  useEffect(() => {
    if (window.ethereum) {
      // Reconnect if session exists
      if (localStorage.getItem("walletConnected") === "true") {
        connectWallet(true);
      }

      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
          toast.error("Wallet disconnected");
        } else {
          const newAddress = accounts[0];
          setWalletAddress(newAddress);
          toast.success(`Switched to: ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`);
        }
      });

      window.ethereum.on("chainChanged", (newChainId) => {
        setChainId(newChainId);
        if (newChainId !== AMOY_CHAIN_ID) {
          console.warn("Wrong network detected");
        }
      });
    }
  }, [connectWallet, disconnectWallet]);

  const isWrongNetwork = useMemo(() => chainId && chainId !== AMOY_CHAIN_ID, [chainId]);

  const value = useMemo(
    () => ({ walletAddress, connecting, isWrongNetwork, connectWallet, disconnectWallet, switchNetwork }),
    [walletAddress, connecting, isWrongNetwork, connectWallet, disconnectWallet, switchNetwork]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
