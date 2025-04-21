// ✅ story.js (완전 보정된 JSON 파서 포함)
import express from "express";
import multer from "multer";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const router = express.Router();
const upload = multer();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt() {
  return `
You are a visual story designer AI.
Based on an image and theme prompt, generate a short story summary and exactly 30 visual cutscenes.

📌 Rules:
- Each cutscene must NOT include script or narration fields.
- Include ONLY: description, camera, pose, face, video_time.
- Use correct JSON syntax (all keys must be wrapped in double quotes).
⏱ Each scene should be 0.5~3.0 seconds. Total duration: 50~60 seconds.

DO NOT explain.
DO NOT use markdown.
DO NOT add any prefix/suffix.
Respond ONLY with raw JSON.

🎯 Format:
{
  "summary": "...",
  "cutscenes": [
    {
      "scene": 1,
      "description": "...",
      "camera": "...",
      "pose": "...",
      "face": "...",
      "video_time": "1.5"
    },
    ...
  ]
}`;
}

router.post("/vision", upload.single("image"), async (req, res) => {
  const { prompt, selectedCharacter } = req.body;
  const imageBuffer = req.file?.buffer;

  if (!imageBuffer) {
    return res.status(400).json({ error: "이미지 파일 누락됨" });
  }

  const userPrompt = `
Character: ${selectedCharacter}
Prompt: ${prompt}

Create a fun, imaginative story suitable for animation. Avoid any sensitive, violent, or dark themes. Keep it lighthearted and creative.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.9,
      max_tokens: 3000,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
              },
            },
          ],
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw || raw.toLowerCase().includes("i'm sorry")) {
      throw new Error("GPT 응답 거부 또는 정책 필터에 차단됨");
    }

    fs.writeFileSync("last-gpt-response.txt", raw);

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error("GPT 응답 내 JSON 블록 없음");
    }

    let jsonText = raw
      .slice(jsonStart, jsonEnd + 1)
      .replace(/“|”/g, '"')
      .replace(/'([^']+)'/g, '"$1"')
      .replace(/\n|\t|\r/g, " ")
      .replace(/\"/g, '"')
      .replace(/\s\s+/g, " ")
      .trim();

    // ✅ 자동 쌍따옴표 보정 (scene: → "scene":)
    jsonText = jsonText.replace(/([{,\s])(\w+):/g, '$1"$2":');

    const parsed = JSON.parse(jsonText);
    console.log("✅ JSON 파싱 완료. 프론트로 전송");
    res.status(200).json(parsed);
  } catch (err) {
    console.error("❌ 스토리 생성 실패:", err.message);
    res.status(500).json({
      error: "스토리 생성 실패",
      message: err.message,
      tip: "GPT 응답이 올바른 JSON 형식이 아닐 수 있습니다. 프롬프트를 순화하거나 다시 시도해 주세요.",
    });
  }
});

export default router;
