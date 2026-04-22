import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeWithGemini(filePath, mimeType, mode = "detect", retries = 2) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString("base64");
    const prompt = mode === "register" ? getRegisterPrompt() : getDetectPrompt();

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    return parseGeminiResponse(result.response.text());
  } catch (error) {
    if (error.message.includes("503") && retries > 0) {
      console.warn(`Gemini 503 High Demand Error. Retrying... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return analyzeWithGemini(filePath, mimeType, mode, retries - 1);
    }
    console.error("Gemini API Error:", error);
    return {
      verdict: "UNKNOWN",
      authenticityScore: 50,
      description: "AI analysis unavailable: " + (error.message.includes("503") ? "High demand. Please try again later." : error.message),
      error: error.message,
    };
  }
}


// ============================================================
// Analyze Text Content with Gemini (for documents)
// ============================================================
// Sends extracted text to Gemini instead of binary file data.
// Used for PDFs and text documents where text has been extracted.
// ============================================================
export async function analyzeTextWithGemini(textContent, mode = "register", retries = 2) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = mode === "register"
      ? `Analyze this sports-related document text for registration. Is it original content?\n\nText:\n${textContent}\n\nRespond ONLY valid JSON with keys: verdict, authenticityScore, description, sport, contentType, detectedElements, manipulationSigns, registrationRecommended.`
      : `Analyze this document text for plagiarism or manipulation.\n\nText:\n${textContent}\n\nRespond ONLY valid JSON with keys: verdict, authenticityScore, description, manipulationSigns, deepfakeIndicators, suspiciousElements, recommendation.`;

    const result = await model.generateContent(prompt);

    return parseGeminiResponse(result.response.text());
  } catch (error) {
    if (error.message.includes("503") && retries > 0) {
      console.warn(`Gemini Text 503 High Demand Error. Retrying... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return analyzeTextWithGemini(textContent, mode, retries - 1);
    }
    return {
      verdict: "UNKNOWN",
      authenticityScore: 50,
      description: "AI text analysis unavailable: " + (error.message.includes("503") ? "High demand." : error.message),
      error: error.message,
    };
  }
}


function getRegisterPrompt() {
  return `Analyze this sports media content for registration. 
  1. Determine if it's original sports footage/imagery.
  2. Check for any signs of AI manipulation, photoshopping, or editing.
  3. Identify the sport, players, and context.
  Respond ONLY valid JSON with keys: verdict (AUTHENTIC, MANIPULATED, or SUSPICIOUS), authenticityScore (0-100), description, sport, contentType, detectedElements (array), manipulationClues (array of specific signs), registrationRecommended (boolean).`;
}

function getDetectPrompt() {
  return `Analyze this sports media content for piracy, deepfakes, or manipulation. 
  1. Does it show signs of being edited (color grading, overlays, face swaps, cuts)?
  2. Is it a duplicate of known sports events?
  3. Provide a list of specific clues for your verdict.
  Respond ONLY valid JSON with keys: verdict (AUTHENTIC, MANIPULATED, or SUSPICIOUS), authenticityScore (0-100), description, manipulationClues (array), deepfakeIndicators (array), suspiciousElements (array), recommendation.`;
}

function parseGeminiResponse(text) {
  try {
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(cleaned);

    return {
      verdict: parsed.verdict || "UNKNOWN",
      authenticityScore: parsed.authenticityScore || 50,
      description: parsed.description || "No description",
      manipulationClues: parsed.manipulationClues || parsed.manipulationSigns || [],
      deepfakeIndicators: parsed.deepfakeIndicators || [],
      sport: parsed.sport || "unknown",
      contentType: parsed.contentType || "unknown",
      recommendation: parsed.recommendation || "",
      registrationRecommended: parsed.registrationRecommended !== false,
    };
  } catch {
    return {
      verdict: "UNKNOWN",
      authenticityScore: 50,
      description: "Could not parse AI response",
      manipulationSigns: [],
      deepfakeIndicators: [],
      error: "JSON parse failed",
    };
  }
}

