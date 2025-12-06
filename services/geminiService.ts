import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Use Gemini 3 Pro for complex reasoning and code analysis
const REASONING_MODEL = "gemini-3-pro-preview";
// Use Flash for quick UI feedback if needed, but sticking to Pro for quality here
const FAST_MODEL = "gemini-2.5-flash";

export const analyzePRCompliance = async (
  code: string,
  requirements: string
): Promise<AnalysisResult> => {
  const ai = getClient();

  const prompt = `
    You are an expert Senior Software Engineer and QA Automation Specialist.
    Your task is to perform a "Vibe Check" on a Pull Request.
    
    You will be provided with:
    1. A snippet of code from a PR (The Code).
    2. A set of requirements from a Jira Ticket (The Requirements).

    You must:
    1. Analyze if the code strictly meets the requirements.
    2. Identify logical errors, edge cases, or missing features.
    3. Generate a "Vibe Score" (0-100) based on code quality and compliance.
    4. Write a unit test (using Jest/Vitest syntax) that would verify these requirements.
    5. If there are issues, provide a corrected version of the code.

    Format the output as JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      compliant: { type: Type.BOOLEAN, description: "Does the code meet all requirements?" },
      score: { type: Type.INTEGER, description: "Quality score from 0 to 100" },
      summary: { type: Type.STRING, description: "Executive summary of the analysis" },
      issues: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of specific issues found"
      },
      suggestedFix: { type: Type.STRING, description: "The corrected code block (if needed), else empty string" },
      generatedTests: { type: Type.STRING, description: "Complete unit test code block" },
      reasoning: { type: Type.STRING, description: "Detailed technical explanation of the findings" }
    },
    required: ["compliant", "score", "summary", "issues", "generatedTests", "reasoning"]
  };

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `--- REQUIREMENTS (JIRA) ---\n${requirements}` }] },
        { role: 'user', parts: [{ text: `--- PR CODE ---\n${code}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const debugStep = async (
  history: { role: string; content: string }[],
  newMessage: string
): Promise<string> => {
  const ai = getClient();

  // Convert history to Gemini format
  const contents = history.map(msg => ({
    role: msg.role === 'admin' ? 'model' : msg.role, // map custom roles if needed
    parts: [{ text: msg.content }]
  }));

  // Add new message
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  const systemInstruction = `
    You are an autonomous debugging assistant. 
    You are helping a developer fix a bug in their PR. 
    Be concise, technical, and provide specific code snippets when asked.
    You have deep knowledge of TypeScript, React, and API contracts.
  `;

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Debug Error:", error);
    return "Error connecting to the debugger agent.";
  }
};

export const generateUnitTest = async (code: string): Promise<string> => {
  const ai = getClient();
  const prompt = `Generate a comprehensive Jest/React Testing Library test suite for the following component/function. Include edge cases. \n\n Code: \n${code}`;

  const response = await ai.models.generateContent({
    model: REASONING_MODEL,
    contents: prompt
  });

  return response.text || "// Failed to generate tests";
}
