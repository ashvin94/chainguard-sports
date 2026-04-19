// Deployed SportsMediaRegistry on Polygon Amoy
export const CONTRACT_ADDRESS = "0x9cb604862c4d36F0c302253CBa2CF796c00e0bd0";

export const CONTRACT_ABI = [
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
    name: "getMyNFTs",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
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
    name: "getTotalNFTs",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "ownerTokens",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
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
      { internalType: "bool", name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
