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
      let content = response.data.choices[0].message.content;

      // Extract JSON if wrapped in code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }

      analysis = JSON.parse(content);
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
