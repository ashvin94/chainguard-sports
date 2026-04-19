import fs from "fs";
import * as Hash from "ipfs-only-hash";

/**
 * Calculates the IPFS CID locally WITHOUT uploading the file to the public network.
 * @param {string} filePath - The path to the file to be processed.
 * @returns {Promise<string>} The IPFS CID hash (e.g., ipfs://Qm...)
 */
export async function uploadToIPFS(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    
    // Calculates the exact v0 CID that IPFS would generate
    const hash = await Hash.of(data);
    
    console.log(`🔒 Local IPFS CID generated successfully: ${hash}`);
    return `ipfs://${hash}`;
  } catch (error) {
    console.error("❌ Error generating local IPFS CID:", error.message);
    return "ipfs_pending";
  }
}
