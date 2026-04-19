import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeWithGemini(filePath, mimeType, mode = "detect") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString("base64");
    const prompt = mode === "register" ? getRegisterPrompt() : getDetectPrompt();

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    return parseGeminiResponse(result.response.text());
  } catch (error) {
    return {
      verdict: "UNKNOWN",
      authenticityScore: 50,
      description: "AI analysis unavailable",
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
export async function analyzeTextWithGemini(textContent, mode = "register") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = mode === "register"
      ? `Analyze this sports-related document text for registration. Is it original content?\n\nText:\n${textContent}\n\nRespond ONLY valid JSON with keys: verdict, authenticityScore, description, sport, contentType, detectedElements, manipulationSigns, registrationRecommended.`
      : `Analyze this document text for plagiarism or manipulation.\n\nText:\n${textContent}\n\nRespond ONLY valid JSON with keys: verdict, authenticityScore, description, manipulationSigns, deepfakeIndicators, suspiciousElements, recommendation.`;

    const result = await model.generateContent(prompt);

    return parseGeminiResponse(result.response.text());
  } catch (error) {
    return {
      verdict: "UNKNOWN",
      authenticityScore: 50,
      description: "AI text analysis unavailable",
      error: error.message,
    };
  }
}

function getRegisterPrompt() {
  return `Analyze this sports media content and respond ONLY valid JSON with keys: verdict, authenticityScore, description, sport, contentType, detectedElements, manipulationSigns, registrationRecommended.`;
}

function getDetectPrompt() {
  return `Analyze this sports media content for authenticity/manipulation and respond ONLY valid JSON with keys: verdict, authenticityScore, description, manipulationSigns, deepfakeIndicators, suspiciousElements, recommendation.`;
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
      manipulationSigns: parsed.manipulationSigns || [],
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

