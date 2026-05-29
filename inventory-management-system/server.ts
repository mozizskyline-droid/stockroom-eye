/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsing middleware
  app.use(express.json());

  // ----------------------------------------------------
  // SERVER SIDE API GATEWAYS (E.g. AI Gating)
  // ----------------------------------------------------
  
  // RESTOCK AI ADVISORY ENDPOINT (Using Gemini 3.5 Flash)
  app.post("/api/gemini/suggest-restock", async (req, res) => {
    try {
      const { product, sales, transactions } = req.body;
      
      if (!product) {
        res.status(400).json({ error: "Product payload is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      
      // LAZY FALLBACK INTEGRATING OPTIONAL KEY GATING TO PREVENT TRANSITION CRASHES
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // Fallback calculation: Desired Level (minStock * 2) - current quantity
        const currentQty = product.quantity || 0;
        const minVal = product.minStock || 0;
        const calcQty = Math.max(5, (minVal * 2) - currentQty);
        
        res.json({
          suggestedQuantity: calcQty,
          recommendation: `**Fallback Advisor (API Key Pending):** Recommending **${calcQty} units** based on standard safety-stock calculation. To activate actual AI optimization models, please configure your **GEMINI_API_KEY** under Settings > Secrets.`,
          isMock: true
        });
        return;
      }

      // Initialize Gemini Client with standard metadata
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Frame rich data context for Gemini reasoning
      const itemDetail = JSON.stringify(product, null, 2);
      const salesDetail = JSON.stringify(sales || [], null, 2);
      const txDetail = JSON.stringify(transactions || [], null, 2);

      const prompt = `You are an expert AI inventory replenishment and supply chain forecasting engine.
Given the following product attributes and transaction records, predict the optimal restock order quantity.

### PRODUCT INFO:
${itemDetail}

### RECENT HISTORIC SALES IN SYSTEM:
${salesDetail}

### RECENT TRANSACTION AUDIT LOG:
${txDetail}

---
CRITICAL ACTION: Return your result EXCLUSIVELY as a JSON object, conforming strictly to the following Schema:
{
  "suggestedQuantity": number,
  "recommendation": "A professional 2-3 sentence markdown layout of why you selected this quantity, listing any patterns found in the sales or transaction logs."
}
Do NOT wrap your JSON response in markdown blocks other than standard JSON format, only return the JSON string.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      let result;
      try {
        result = JSON.parse(responseText.trim());
      } catch (parseErr) {
        // Fallback parse if markdown got returned
        const cleanedStr = responseText.replace(/```json|```/gi, "").trim();
        result = JSON.parse(cleanedStr);
      }

      res.json({
        suggestedQuantity: Number(result.suggestedQuantity) || 10,
        recommendation: result.recommendation || "Restock suggested based on current safety metrics.",
        isMock: false
      });

    } catch (error) {
      console.error("Gemini Restock Suggestion Error:", error);
      res.status(500).json({ 
        error: "Failed to generate recommendation", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // ----------------------------------------------------
  // VITE DEVELOPMENT MIDDLEWARE & STATIC SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve client production static build files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server booted and routing active at http://localhost:${PORT}`);
  });
}

startServer();
