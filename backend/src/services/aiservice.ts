import { GoogleGenerativeAI } from "@google/generative-ai";
import debug from "debug";
import env from "../config/env.js";

const GOOGLE_API_KEY: string | undefined = env.GOOGLE_API_KEY;
const ai_debug = debug("app:gemini");

if (!GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing");
}

ai_debug("🔑 API Key loaded:", GOOGLE_API_KEY.substring(0, 10) + "...");
const genai = new GoogleGenerativeAI(GOOGLE_API_KEY);

const model = genai.getGenerativeModel(
  { model: "gemini-2.5-flash" },
  { apiVersion: "v1", timeout: 30000 },
);

async function askGemini(prompt: string, retries = 5): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      ai_debug(`📤 Sending request to Gemini... (Attempt ${i + 1}/${retries})`);
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      ai_debug("✅ Gemini says:", response);
      return response;
    } catch (error: any) {
      const isLast = i === retries - 1;
      const status = error.status || error.code;
      const message = error.message || String(error);

      ai_debug(`❌ Attempt ${i + 1} failed:`, {
        status,
        message: message.substring(0, 150),
      });

      // Retry on transient errors (503, network failures, etc.)
      if (!isLast && (status === 503 || message.includes("fetch"))) {
        const delay = Math.pow(2, i) * 1000;
        ai_debug(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Last attempt or permanent error
      ai_debug("❌ Final error:", error);
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export default askGemini;
