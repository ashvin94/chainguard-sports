// ============================================================
// blockchain.js — Backend Mints NFT (User Pays Nothing!)
// ============================================================
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Lazy initialization — only connects when actually minting
let provider = null;
let signer = null;

function getSigner() {
  if (!signer) {
    if (!process.env.DEPLOYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY === "your_metamask_private_key") {
      throw new Error("DEPLOYER_PRIVATE_KEY not set in .env — add your MetaMask private key");
    }
    provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
    signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  }
  return signer;
}

// Full ABI from deployed SportsMediaRegistry contract
const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_sha256Hash", type: "string" },
      { internalType: "string", name: "_contentCID", type: "string" },
      { internalType: "string", name: "_fileName", type: "string" },
      { internalType: "string", name: "_fileType", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
    ],
    name: "mintNFT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "string", name: "sha256Hash", type: "string" },
      { indexed: false, internalType: "string", name: "contentCID", type: "string" },
    ],
    name: "NFTMinted",
    type: "event",
  },
  {
    inputs: [],
    name: "getTotalNFTs",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "getNFT",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "string", name: "sha256Hash", type: "string" },
          { internalType: "string", name: "contentCID", type: "string" },
          { internalType: "string", name: "fileName", type: "string" },
          { internalType: "string", name: "fileType", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
        ],
        internalType: "struct SportsMediaRegistry.MediaNFT",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyNFTs",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "hashToTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function mintNFTFromBackend(
  sha256Hash,
  contentCID,
  fileName,
  fileType,
  description
) {
  try {
    console.log("⛓️ Minting NFT from backend wallet...");

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      getSigner()
    );

    // Your wallet pays gas here!
    const tx = await contract.mintNFT(
      sha256Hash,
      contentCID,
      fileName,
      fileType,
      description
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ NFT minted! TX:", receipt.hash);

    // Parse tokenId from NFTMinted event logs
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === "NFTMinted") {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch (e) {
        // Skip logs that don't match our ABI
      }
    }

    return {
      success: true,
      txHash: receipt.hash,
      tokenId,
    };
  } catch (error) {
    console.error("❌ NFT mint failed:", error.message);
    return { success: false, error: error.message };
  }
}
