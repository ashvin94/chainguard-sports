import pinataSDK from "@pinata/sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize Pinata with your keys from .env
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

/**
 * Uploads a file to IPFS using Pinata.
 * @param {string} filePath - The path to the file to be uploaded.
 * @returns {Promise<string>} The IPFS CID URI (ipfs://...)
 */
export async function uploadToIPFS(filePath) {
  try {
    console.log(`☁️ Uploading ${filePath} to Pinata IPFS...`);

    const readableStreamForFile = fs.createReadStream(filePath);
    const options = {
      pinataMetadata: {
        name: `ChainGuard_${Date.now()}`,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    
    const ipfsUri = `ipfs://${result.IpfsHash}`;
    console.log(`✅ Pinata Upload successful! CID: ${ipfsUri}`);
    
    return ipfsUri;
  } catch (error) {
    console.error("❌ Pinata upload error:", error.message);
    
    // Fallback: If Pinata fails, we return a "pending" status 
    // so the rest of the registration (Blockchain/AI) can still proceed
    return "ipfs_failed";
  }
}
