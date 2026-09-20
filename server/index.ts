import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  app.post('/api/calculate-impact', async (req, res) => {
    try {
      const { activity, details } = req.body;

      const prompt = `
You are an eco-impact calculator. Analyze this activity and provide:
1. Carbon footprint estimate (kg CO2 equivalent)
2. Annual impact projection
3. Efficiency score (0-100, where 100 is best)
4. One specific recommendation to reduce impact

Activity: ${activity}
Details: ${JSON.stringify(details)}

Respond in JSON format ONLY:
{
  "carbon_kg_weekly": <number>,
  "carbon_kg_annual": <number>,
  "efficiency_score": <number>,
  "recommendation": "<string>",
  "analysis": "<string>"
}
      `;

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-opus-4-6',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1024
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'EcoCoach'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Attempt to clean the content in case the model returns markdown code blocks
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanedContent);

      res.json({
        success: true,
        data: result,
        timestamp: new Date()
      });

    } catch (error: any) {
      console.error('Error in API:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Use 5000 for backend by default so it doesn't clash with Vite's 3000
  const port = process.env.PORT || 5000;

  server.listen(port, () => {
    console.log(`API Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
