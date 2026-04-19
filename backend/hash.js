import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { execSync } from "child_process";

export function generateSHA256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

export async function generatePHash(imagePath) {
  try {
    const { data } = await sharp(imagePath)
      .resize(32, 32, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let total = 0;
    for (let i = 0; i < data.length; i++) total += data[i];
    const average = total / data.length;

    let hash = "";
    for (let i = 0; i < data.length; i++) hash += data[i] >= average ? "1" : "0";
    return hash;
  } catch (error) {
    console.error("pHash generation failed:", error.message);
    return null;
  }
}

export function comparePHashes(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return { similarity: 0, distance: 999, verdict: "UNKNOWN" };
  }

  let differentBits = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) differentBits++;
  }

  const similarity = Math.round(((hash1.length - differentBits) / hash1.length) * 100);

  let verdict;
  if (similarity >= 99) verdict = "EXACT_COPY";
  else if (similarity >= 95) verdict = "PIRATED";
  else if (similarity >= 85) verdict = "SUSPICIOUS";
  else verdict = "DIFFERENT";

  return { similarity, distance: differentBits, verdict };
}

// ============================================================
// Generate Video pHash
// ============================================================
// Extracts key frames from video using ffmpeg, then generates
// pHash for each frame and combines into a single hash.
// ============================================================
export async function generateVideoPHash(videoPath, tempDir) {
  try {
    console.log("🎥 Extracting video frames...");

    // Create temp directory for frames
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Extract 5 frames evenly spaced through the video using ffmpeg
    try {
      execSync(
        `ffmpeg -i "${videoPath}" -vf "select=not(mod(n\\,30))" -frames:v 5 -vsync vfr "${path.join(tempDir, "frame_%03d.png")}" -y`,
        { stdio: "pipe", timeout: 30000 }
      );
    } catch (e) {
      console.warn("⚠️ ffmpeg frame extraction failed, using video file directly");
      // Fallback: try to use sharp directly on the video (gets first frame for some formats)
      const hash = await generatePHash(videoPath);
      return hash;
    }

    // Find extracted frame files
    const frames = fs.readdirSync(tempDir)
      .filter((f) => f.startsWith("frame_") && f.endsWith(".png"))
      .sort();

    if (frames.length === 0) {
      console.warn("⚠️ No frames extracted, using fallback");
      return await generatePHash(videoPath);
    }

    // Generate pHash for each frame
    const frameHashes = [];
    for (const frame of frames) {
      const framePath = path.join(tempDir, frame);
      const hash = await generatePHash(framePath);
      if (hash) frameHashes.push(hash);
    }

    if (frameHashes.length === 0) return null;

    // Combine frame hashes: take majority bit at each position
    const hashLength = frameHashes[0].length;
    let combinedHash = "";

    for (let i = 0; i < hashLength; i++) {
      let ones = 0;
      for (const hash of frameHashes) {
        if (hash[i] === "1") ones++;
      }
      combinedHash += ones > frameHashes.length / 2 ? "1" : "0";
    }

    console.log(`✅ Video pHash generated from ${frameHashes.length} frames`);
    return combinedHash;

  } catch (error) {
    console.error("❌ Video pHash failed:", error.message);
    return null;
  }
}

