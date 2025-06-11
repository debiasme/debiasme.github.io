import axios from "axios";
import { prompts } from "../prompts.js";
import { cleanBiasType } from "../utils/cleanBiasType.js";
import { AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT } from "../config.js";
import { callAzureOpenAI } from "../utils/azureApi.js";

const API_VERSION = "2024-12-01-preview";

export async function analyzeBias(req, res) {
  try {
    console.log("analyzeBias endpoint called");
    const { userInput } = req.body;
    const content = await callAzureOpenAI(
      [
        { role: "system", content: prompts.biasAnalysis },
        { role: "user", content: userInput },
      ],
      { max_tokens: 800, temperature: 0.7 }
    );

    // Log the raw AI response for debugging
    console.log("Raw AI response from Azure:", content);

    let analysis;
    try {
      // Use the actual content returned by callAzureOpenAI
      let parsedContent = content;

      // Try to extract JSON from code block if present
      const codeBlockMatch = parsedContent.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/i
      );
      if (codeBlockMatch) {
        parsedContent = codeBlockMatch[1].trim();
      }

      // If still not valid JSON, try to extract the first {...} block
      if (!parsedContent.trim().startsWith("{")) {
        const curlyMatch = parsedContent.match(/{[\s\S]+}/);
        if (curlyMatch) {
          parsedContent = curlyMatch[0];
        }
      }

      analysis = JSON.parse(parsedContent);
      if (analysis.biases) {
        analysis.biases = analysis.biases.map((bias) => ({
          ...bias,
          type: cleanBiasType(bias.type),
        }));
      }
    } catch (err) {
      console.error("Failed to parse AI response JSON:", err);
      analysis = { biases: [] };
    }

    // Log the parsed analysis for debugging
    console.log("Parsed analysis:", analysis);

    res.json(analysis);
  } catch (error) {
    if (error.response) {
      console.error(
        "Azure API error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("analyzeBias error:", error);
    }
    res.status(500).json({ biases: [] });
  }
}
