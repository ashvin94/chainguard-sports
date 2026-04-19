// ============================================================
// document.js — Document Text Extraction & Comparison
// ============================================================
// Supports:
// → PDF files (.pdf)
// → Text files (.txt)
// → Future: Word docs (.docx)
//
// How document similarity works:
// → Extract text from document
// → Clean and normalize text
// → Generate word frequency fingerprint
// → Compare fingerprints = similarity %
//
// This catches:
// ✅ Exact duplicate documents
// ✅ Same document with minor edits
// ✅ Plagiarized content (reworded slightly)
// ✅ Copy-pasted sections
// ============================================================

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

// ============================================================
// Extract Text from Document
// ============================================================
// Handles PDF and plain text files
// ============================================================
export async function extractTextFromDocument(filePath, mimeType) {
  try {
    console.log("📄 Extracting text from document...");

    if (mimeType === "text/plain") {
      // Plain text — just read directly
      const text = fs.readFileSync(filePath, "utf8");
      return cleanText(text);
    }

    if (mimeType === "application/pdf") {
      return extractFromPDF(filePath);
    }

    // Fallback for unknown types
    console.warn("⚠️ Unknown document type, trying plain text read");
    const text = fs.readFileSync(filePath, "utf8");
    return cleanText(text);

  } catch (error) {
    console.error("❌ Text extraction failed:", error.message);
    return null;
  }
}

// ============================================================
// Extract Text from PDF
// ============================================================
// Uses pdftotext (part of poppler-utils) via command line
// Install: this comes with most Linux/Mac systems
// Windows: install poppler from github.com/oschwartz10612/poppler-windows
// ============================================================
function extractFromPDF(pdfPath) {
  try {
    // Try pdftotext command (poppler)
    const output = execSync(`pdftotext "${pdfPath}" -`, {
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
    });
    return cleanText(output);
  } catch (error) {
    console.warn("⚠️ pdftotext not available, using fallback");
    return extractPDFManually(pdfPath);
  }
}

// ============================================================
// Manual PDF Text Extraction (Fallback)
// ============================================================
// Reads raw PDF bytes and extracts text strings
// Works for simple PDFs without heavy encoding
// ============================================================
function extractPDFManually(pdfPath) {
  try {
    const buffer = fs.readFileSync(pdfPath);
    const content = buffer.toString("latin1");

    // Extract text between BT and ET markers (PDF text blocks)
    const textBlocks = [];
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;

    while ((match = btEtRegex.exec(content)) !== null) {
      const block = match[1];
      // Extract strings in parentheses (PDF text format)
      const stringRegex = /\(([^)]+)\)/g;
      let strMatch;
      while ((strMatch = stringRegex.exec(block)) !== null) {
        textBlocks.push(strMatch[1]);
      }
    }

    const extracted = textBlocks.join(" ");
    return cleanText(extracted) || "PDF text extraction limited";

  } catch (error) {
    console.error("Manual PDF extraction failed:", error.message);
    return null;
  }
}

// ============================================================
// Clean and Normalize Text
// ============================================================
// Removes special chars, extra spaces, lowercases
// Makes comparison consistent
// ============================================================
function cleanText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")  // Remove special chars
    .replace(/\s+/g, " ")           // Normalize spaces
    .trim()
    .substring(0, 10000);           // Limit to 10000 chars
}

// ============================================================
// Generate Document Fingerprint
// ============================================================
// Creates a fingerprint from word frequencies
// Similar documents have similar word distributions
// ============================================================
export function generateDocumentFingerprint(text) {
  if (!text || text.length < 10) return null;

  // Split into words
  const words = text.split(" ").filter((w) => w.length > 2);

  if (words.length === 0) return null;

  // Count word frequencies
  const wordFreq = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  // Get top 100 most frequent words
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([word]) => word);

  // Create fingerprint string from top words
  const fingerprintStr = topWords.join("|");

  // Also create SHA256 of full text for exact match
  const sha256 = crypto
    .createHash("sha256")
    .update(text)
    .digest("hex");

  return {
    topWords,           // For similarity comparison
    fingerprintStr,     // String version
    textSHA256: sha256, // For exact match
    wordCount: words.length,
    charCount: text.length,
  };
}

// ============================================================
// Compare Document Fingerprints
// ============================================================
// Returns similarity % between two documents
// ============================================================
export function compareDocumentFingerprints(fp1, fp2) {
  if (!fp1 || !fp2) {
    return { similarity: 0, verdict: "UNKNOWN" };
  }

  // Check exact match first (SHA256)
  if (fp1.textSHA256 === fp2.textSHA256) {
    return {
      similarity: 100,
      verdict: "EXACT_COPY",
      method: "SHA256",
    };
  }

  // Compare top words overlap
  const words1 = new Set(fp1.topWords);
  const words2 = new Set(fp2.topWords);

  // Count common words
  let commonWords = 0;
  for (const word of words1) {
    if (words2.has(word)) commonWords++;
  }

  // Jaccard similarity = intersection / union
  const unionSize = words1.size + words2.size - commonWords;
  const similarity = Math.round((commonWords / unionSize) * 100);

  let verdict;
  if (similarity >= 95) verdict = "EXACT_COPY";
  else if (similarity >= 80) verdict = "PLAGIARIZED";
  else if (similarity >= 60) verdict = "HIGHLY_SIMILAR";
  else if (similarity >= 40) verdict = "SUSPICIOUS";
  else verdict = "DIFFERENT";

  return {
    similarity,
    verdict,
    commonWords,
    method: "WORD_FREQUENCY",
  };
}

// ============================================================
// Full Document Analysis Pipeline
// ============================================================
// Extract → Fingerprint → Return for comparison
// ============================================================
export async function analyzeDocument(filePath, mimeType) {
  try {
    // Extract text
    const text = await extractTextFromDocument(filePath, mimeType);

    if (!text || text.length < 10) {
      return {
        success: false,
        error: "Could not extract text from document",
        fingerprint: null,
        textPreview: null,
      };
    }

    // Generate fingerprint
    const fingerprint = generateDocumentFingerprint(text);

    return {
      success: true,
      fingerprint,
      textPreview: text.substring(0, 200) + "...", // First 200 chars
      wordCount: fingerprint?.wordCount || 0,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      fingerprint: null,
    };
  }
}
