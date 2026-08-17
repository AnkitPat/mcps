import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT ?? 3000);

app.post("/update-challenge", express.text(), (req, res) => {
  const token = req.body;
  if (!token) {
    return res.status(400).send("Token is required");
  }
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(__dirname, "../public/.well-known/openai-apps-challenge");
  fs.writeFileSync(filePath, token);
  res.send("Challenge token updated");
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "product-commerce-mcp"
  });
});

app.listen(PORT, () => {
  console.log(
    `Product Commerce MCP running on http://localhost:${PORT}`
  );

  console.log(
    `MCP endpoint: http://localhost:${PORT}/mcp`
  );
});
