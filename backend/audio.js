// ============================================================
// audio.js — Audio Fingerprinting
// ============================================================
// How audio fingerprinting works:
// → Convert audio to raw PCM samples
// → Split into small chunks (frames)
// → For each chunk: calculate energy in frequency bands
// → Compare high/low energy → generate binary fingerprint
// → Similar songs = similar fingerprints
//
// This catches:
// ✅ Exact same audio file
// ✅ Same audio with different bitrate
// ✅ Same audio re-encoded (MP3 → WAV)
// ✅ Same audio with slight noise added
// ❌ Same song but different recording
// ============================================================

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ============================================================
// Generate Audio Fingerprint
// ============================================================
// Steps:
// 1. Convert audio to raw PCM using ffmpeg
// 2. Read raw samples
// 3. Split into frames
// 4. Calculate energy per frame
// 5. Compare adjacent frames → binary hash
// ============================================================
export async function generateAudioFingerprint(audioPath) {
  const tempDir = path.join(path.dirname(audioPath), "audio_temp");
  const rawPath = path.join(tempDir, "audio_raw.pcm");

  try {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // ── Step 1: Convert to raw PCM using ffmpeg ───────────
    // -ar 11025  = sample rate 11025 Hz (lower = faster)
    // -ac 1      = mono channel
    // -f s16le   = 16-bit signed little endian format
    console.log("🎵 Converting audio to raw PCM...");
    execSync(
      `ffmpeg -i "${audioPath}" -ar 11025 -ac 1 -f s16le "${rawPath}" -y`,
      { stdio: "pipe" }
    );

    // ── Step 2: Read raw PCM samples ─────────────────────
    const buffer = fs.readFileSync(rawPath);

    // Each sample is 2 bytes (16-bit)
    const samples = new Int16Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / 2
    );

    if (samples.length === 0) {
      throw new Error("No audio samples extracted");
    }

    // ── Step 3: Generate fingerprint from samples ─────────
    const fingerprint = generateFingerprintFromSamples(samples);

    // Cleanup temp files
    cleanupTemp(tempDir);

    console.log("✅ Audio fingerprint generated");
    return fingerprint;

  } catch (error) {
    cleanupTemp(tempDir);
    console.error("❌ Audio fingerprint failed:", error.message);

    // Fallback: use SHA256 of file as fingerprint
    console.log("⚠️ Using SHA256 fallback for audio");
    const buffer = fs.readFileSync(audioPath);
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }
}

// ============================================================
// Generate Fingerprint from PCM Samples
// ============================================================
// Splits samples into frames and creates binary fingerprint
// ============================================================
function generateFingerprintFromSamples(samples) {
  const FRAME_SIZE = 512;  // samples per frame
  const fingerprint = [];

  // Process each frame
  for (let i = 0; i < samples.length - FRAME_SIZE; i += FRAME_SIZE) {
    // Get current frame
    const frame = samples.slice(i, i + FRAME_SIZE);

    // Calculate RMS energy of this frame
    let energy = 0;
    for (let j = 0; j < frame.length; j++) {
      energy += frame[j] * frame[j];
    }
    energy = Math.sqrt(energy / frame.length);

    fingerprint.push(energy);

    // Stop at 1000 frames max (enough for comparison)
    if (fingerprint.length >= 1000) break;
  }

  // Convert energy values to binary string
  // Compare each frame to next frame
  // Rising energy = "1", falling = "0"
  let binaryHash = "";
  for (let i = 0; i < fingerprint.length - 1; i++) {
    binaryHash += fingerprint[i + 1] > fingerprint[i] ? "1" : "0";
  }

  // Pad to fixed length for comparison
  while (binaryHash.length < 999) binaryHash += "0";
  return binaryHash.substring(0, 999);
}

// ============================================================
// Compare Audio Fingerprints
// ============================================================
// Returns similarity percentage between two audio files
// ============================================================
export function compareAudioFingerprints(fp1, fp2) {
  if (!fp1 || !fp2) {
    return { similarity: 0, verdict: "UNKNOWN" };
  }

  // If both are SHA256 hashes (fallback mode)
  if (fp1.length === 64 && fp2.length === 64) {
    const similarity = fp1 === fp2 ? 100 : 0;
    return {
      similarity,
      verdict: similarity === 100 ? "EXACT_COPY" : "DIFFERENT",
    };
  }

  // Compare binary fingerprints using Hamming distance
  const minLen = Math.min(fp1.length, fp2.length);
  let matching = 0;

  for (let i = 0; i < minLen; i++) {
    if (fp1[i] === fp2[i]) matching++;
  }

  const similarity = Math.round((matching / minLen) * 100);

  let verdict;
  if (similarity >= 99) verdict = "EXACT_COPY";
  else if (similarity >= 90) verdict = "SAME_AUDIO";
  else if (similarity >= 80) verdict = "VERY_SIMILAR";
  else if (similarity >= 70) verdict = "SUSPICIOUS";
  else verdict = "DIFFERENT";

  return { similarity, verdict };
}

// ============================================================
// Extract Audio from Video (for video files with audio)
// ============================================================
export async function extractAudioFromVideo(videoPath, outputDir) {
  const audioPath = path.join(outputDir, "extracted_audio.mp3");

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    execSync(
      `ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`,
      { stdio: "pipe" }
    );

    return audioPath;
  } catch (error) {
    console.error("Audio extraction failed:", error.message);
    return null;
  }
}

// ── Cleanup helper ────────────────────────────────────────────
function cleanupTemp(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}
