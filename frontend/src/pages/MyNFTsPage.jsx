import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractABI";

// Read directly from blockchain via public RPC — no MetaMask needed
const provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

export default function MyNFTsPage() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllNFTs();
  }, []);

  async function loadAllNFTs() {
    setLoading(true);
    try {
      const total = await contract.getTotalNFTs();
      const count = Number(total);
      const list = [];
      for (let i = 1; i <= count; i++) {
        const nft = await contract.getNFT(i);
        list.push({
          tokenId: nft.tokenId.toString(),
          owner: nft.owner,
          fileName: nft.fileName,
          fileType: nft.fileType,
          description: nft.description,
          contentCID: nft.contentCID,
          timestamp: new Date(Number(nft.timestamp) * 1000).toLocaleString(),
        });
      }
      setNfts(list);
    } catch (error) {
      console.error("Failed to load NFTs:", error);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <h2>All Registered NFTs</h2>
      <button className="action-btn" onClick={loadAllNFTs} disabled={loading}>
        {loading ? "Loading..." : "🔄 Refresh NFTs"}
      </button>
      {nfts.length === 0 ? (
        <p>No NFTs found.</p>
      ) : (
        <pre>{JSON.stringify(nfts, null, 2)}</pre>
      )}
    </div>
  );
}
