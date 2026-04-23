// Deployed SportsMediaRegistry on Polygon Amoy
export const CONTRACT_ADDRESS = "0x4F9076733247871a035C870FB2bb4191BB42Fc0d";

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
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
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "string", name: "sha256Hash", type: "string" },
      { indexed: false, internalType: "string", name: "contentCID", type: "string" }
    ],
    name: "NFTMinted",
    type: "event"
  },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getMyNFTs",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "hashToTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "nfts",
    outputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string", name: "sha256Hash", type: "string" },
      { internalType: "string", name: "contentCID", type: "string" },
      { internalType: "string", name: "fileName", type: "string" },
      { internalType: "string", name: "fileType", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "ownerTokens",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];
