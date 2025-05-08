import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import { OpenAI } from "openai";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../firebase/serviceAccountKey.json" assert { type: "json" };

dotenv.config();
const router = express.Router();
const upload = multer();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Firebase Admin 초기화
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

// 🎯 Vision 기반 스토리 생성
router.post("/vision", upload.single("image"), async (req, res) => {
  const { prompt, selectedCharacter } = req.body;
  const imageBuffer = req.file?.buffer;

  if (!imageBuffer) {
    return res.status(400).json({ error: "이미지 누락됨" });
  }

  const fullPrompt = `
You are an AI visual storyteller. Based on the uploaded character image and the user's instructions, generate a short story and cutscenes.

📌 Constraints:
- The main character is: **${selectedCharacter}**
- The story theme is: "${prompt}"
- The uploaded image represents the visual style, personality, or vibe of this character.
- Use the image as inspiration for how the character moves, acts, and appears.
- For each cutscene, also generate an AI image prompt in the style of Stable Diffusion/ComfyUI.
- The prompt must describe the scene visually using descriptive tags (style, background, lighting, composition).
- The prompt must include the LoRA trigger tag: "${selectedCharacter}"

🔧 Output Requirements:
- 📘 Summary (3~5 sentences) that clearly features ${selectedCharacter} as the protagonist.
- 🎬 Cutscenes (30 total). Each should contain:
  - description
  - camera
  - pose
  - face
  - video_time (in seconds)

🛑 Do not use pronouns like "she", "he", "the girl", "the boy", "our hero", etc.

✅ Always refer to the main character by their name: "${selectedCharacter}"
✅ Every cutscene description must contain "${selectedCharacter}" at least once.

🧾 Format:
📘 Summary:
A story featuring ${selectedCharacter}...

🎬 Cutscenes:
1. ${selectedCharacter} wakes up and looks around.
  camera: wide shot
  pose: sitting up
  face: curious
  video_time: 1.8
  prompt: A cartoon-style illustration of ${selectedCharacter} sitting up in bed, wide shot, curious face, morning light, flat vector, 2D clean style, white background


2. ${selectedCharacter} walks out into the morning light...
  camera: tracking shot
  pose: walking
  face: calm
  video_time: 2.0
  prompt: A cartoon-style illustration of ${selectedCharacter} sitting up in bed, wide shot, curious face, morning light, flat vector, 2D clean style, white background

Return **only** the content in this format. No extra explanations or commentary.
Only use the name "${selectedCharacter}" when referring to the main character in every cutscene. Never use "she", "he", etc.
`;

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.9,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are a professional visual storytelling AI.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: fullPrompt },
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

    const raw = result.choices?.[0]?.message?.content || "";
    fs.writeFileSync("last-gpt-response.txt", raw);

    // 🧼 Summary 추출
    const summaryMatch = raw.match(/📘 Summary:\s*([\s\S]*?)🎬 Cutscenes:/);
    const summary = summaryMatch?.[1]?.trim();

    // 🎬 Cutscene 파싱
    const rawCuts = raw.split(/🎬 Cutscenes:/)[1]?.trim();
    const blocks = rawCuts?.split(/\n\d+\.\s+/).filter(Boolean) || [];

    const cutscenes = blocks.map((block, i) => {
      const lines = block
        .trim()
        .split("\n")
        .map((l) => l.trim());
      const description = lines[0];
      const camera =
        lines
          .find((l) => l.startsWith("camera:"))
          ?.split("camera:")[1]
          ?.trim() || null;
      const pose =
        lines
          .find((l) => l.startsWith("pose:"))
          ?.split("pose:")[1]
          ?.trim() || null;
      const face =
        lines
          .find((l) => l.startsWith("face:"))
          ?.split("face:")[1]
          ?.trim() || null;
      const time =
        lines
          .find((l) => l.startsWith("video_time:"))
          ?.split("video_time:")[1]
          ?.trim() || "2.0";
      const prompt =
        lines
          .find((l) => l.startsWith("prompt:"))
          ?.split("prompt:")[1]
          ?.trim() || `A cartoon-style illustration of ${selectedCharacter}`;

      return {
        scene: i + 1,
        description,
        camera,
        pose,
        face,
        video_time: parseFloat(time),
        prompt,
      };
    });

    if (!summary || !cutscenes.length) {
      fs.writeFileSync("error-gpt-response.txt", raw); // 오류 추적용
      throw new Error("요약 또는 컷신 파싱 실패");
    }

    await db.collection("stories").doc("currentStory").set({
      createdAt: Date.now(),
      character: selectedCharacter,
      prompt,
      summary,
      cutscenes,
    });

    res.status(200).json({ summary, cutscenes });
  } catch (err) {
    console.error("❌ GPT Vision 파싱 실패:", err.message);
    res.status(500).json({
      error: "파싱 실패",
      message: err.message,
      tip: "GPT 응답 형식이 틀렸거나 구조를 인식하지 못했을 수 있습니다.",
    });
  }
});

export default router;
