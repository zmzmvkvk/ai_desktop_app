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
You are an expert visual storyteller and an AI video director. Your task is to craft a compelling, dynamic short story for YouTube Shorts, featuring a specific character, and generate detailed cutscenes with precise AI image generation prompts. The goal is to create a visually engaging and fast-paced narrative suitable for a 60-second video.

📌 Core Requirements for Story & Cutscenes:
- **Main Character:** **${selectedCharacter}**. Always refer to the character by this exact name. Absolutely no pronouns (he, she, they) or generic terms (our hero, the protagonist).
- **Story Theme:** "${prompt}". Develop a clear, engaging plot around this theme.
- **Image Inspiration:** The uploaded image represents **${selectedCharacter}**'s visual style, personality, and overall vibe. Use it as a consistent visual reference for all generated images.
- **Total Duration:** The sum of all 'video_time' for cutscenes must be **exactly 60 seconds**. Adjust individual scene durations to meet this target.
- **Cutscene Quantity:** Exactly 30 cutscenes. Each cutscene should be concise and impactful.
- **Narrative Arc:** The story must have a clear beginning, middle, and end, with rising action, a climax, and a resolution.
- **Pacing:** Maintain a fast, dynamic pace suitable for YouTube Shorts. Every second counts.

🔧 Detailed Output Requirements for Each Cutscene:
For each of the 30 cutscenes, provide the following:
  - **description**: A concise, vivid description of the scene, always including **${selectedCharacter}**'s name. Focus on action and visual elements.
  - **camera**: Specific camera shot (e.g., wide shot, medium shot, close-up, tracking shot, overhead shot, dynamic low-angle).
  - **pose**: Detailed, dynamic pose (e.g., leaping, whispering, confronting, soaring, sprinting, gazing intently).
  - **face**: Clear facial expression (e.g., determined, curious, ecstatic, surprised, contemplative, fierce).
  - **video_time**: Precise duration in seconds (float, e.g., 2.0). **Ensure the sum of all 30 video_time values is exactly 60.0 seconds.**
  - **image_prompt**: A highly descriptive AI image generation prompt for Stable Diffusion/ComfyUI, ensuring visual consistency.
    - **Character Consistency:** Start each image_prompt with "**${selectedCharacter},**" followed by specific visual tags for the character (e.g., "blue eyes, red scarf, distinct armor").
    - **LoRA Trigger:** Include the LoRA trigger tag: "**${selectedCharacter}_lora_tag**" (Replace with your actual LoRA tag if different, otherwise use a placeholder like "character_lora_tag"). This is critical for maintaining character consistency.
    - **Visual Details:** Describe the scene visually with specific tags for style, background, lighting, composition, and mood (e.g., "cinematic lighting, vibrant colors, epic fantasy setting, shallow depth of field, dramatic angle").
    - **Action & Emotion:** Directly translate the 'description', 'pose', and 'face' into the prompt.
    - **Stylistic Cohesion:** Maintain a consistent artistic style across all image prompts (e.g., "fantasy illustration," "anime style," "realistic render").
  - **voice_over_text**: A very short, impactful phrase or sentence (max 5-7 words) for an AI voice-over, summarizing the scene's action or emotion. This text will be used for Text-to-Speech.
  - **sound_effect_cue**: A simple cue for a relevant sound effect (e.g., "splash," "whoosh," "impact," "triumphant fanfare").
  - **on_screen_text**: A brief, optional text overlay for the screen (max 5 words), if the scene requires a visual title or emphasis. If no text, use "none".

🛑 **Strictly follow the output format below. Do not include any extra text, explanations, or commentary outside of the specified fields.**

🧾 Output Format:
📘 Summary:
A concise, engaging summary (3-5 sentences) of the story, featuring **${selectedCharacter}**.

🎬 Cutscenes:
1. description: ${selectedCharacter} awakens, sunlight filtering through their window.
  camera: wide shot
  pose: sitting up in bed
  face: curious
  video_time: 1.8
  image_prompt: ${selectedCharacter}_lora_tag, ${selectedCharacter}, cozy bedroom, morning light, soft shadows, warm colors, detailed illustration, curious expression, looking around
  voice_over_text: A new day begins for ${selectedCharacter}.
  sound_effect_cue: gentle morning ambiance
  on_screen_text: The Awakening

2. description: ${selectedCharacter} confidently steps into the bustling marketplace.
  camera: tracking shot
  pose: walking purposefully
  face: calm and observant
  video_time: 2.2
  image_prompt: ${selectedCharacter}_lora_tag, ${selectedCharacter}, vibrant market square, diverse crowd, golden hour, dynamic angle, intricate details, determined stride
  voice_over_text: Adventures call in Seaforth.
  sound_effect_cue: marketplace chatter
  on_screen_text: Seaforth Adventures

... (Continue for 30 cutscenes, ensuring total video_time sums to exactly 60.0 seconds)

30. description: ${selectedCharacter} triumphantly holds their prize, a symbol of their victory.
  camera: close-up
  pose: holding prize aloft
  face: ecstatic and proud
  video_time: 2.0
  image_prompt: ${selectedCharacter}_lora_tag, ${selectedCharacter}, gleaming prize, spotlight effect, celebratory atmosphere, confetti, triumphant smile, sharp focus
  voice_over_text: A champion's unforgettable victory!
  sound_effect_cue: triumphant fanfare
  on_screen_text: The Champion

Return **only** the content in this exact format.
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
      const video_time = parseFloat(
        lines
          .find((l) => l.startsWith("video_time:"))
          ?.split("video_time:")[1]
          ?.trim() || "2.0"
      ); // parseFloat로 형변환
      const image_prompt =
        lines
          .find((l) => l.startsWith("image_prompt:"))
          ?.split("image_prompt:")[1]
          ?.trim() || `A dynamic illustration of ${selectedCharacter}`; // 'prompt'에서 'image_prompt'로 변경
      const voice_over_text =
        lines
          .find((l) => l.startsWith("voice_over_text:"))
          ?.split("voice_over_text:")[1]
          ?.trim() || null;
      const sound_effect_cue =
        lines
          .find((l) => l.startsWith("sound_effect_cue:"))
          ?.split("sound_effect_cue:")[1]
          ?.trim() || null;
      const on_screen_text =
        lines
          .find((l) => l.startsWith("on_screen_text:"))
          ?.split("on_screen_text:")[1]
          ?.trim() || null;

      return {
        scene: i + 1,
        description,
        camera,
        pose,
        face,
        video_time, // 이름 변경
        image_prompt, // 이름 변경
        voice_over_text,
        sound_effect_cue,
        on_screen_text,
      };
    });

    // ✨ 전체 video_time 합계 검증 (선택 사항이지만 강력 권장)
    const totalVideoTime = cutscenes.reduce(
      (sum, cut) => sum + cut.video_time,
      0
    );
    if (Math.abs(totalVideoTime - 60.0) > 0.1) {
      // 소수점 오차 감안
      console.warn(
        `⚠️ Warning: Total video time is ${totalVideoTime}s, not exactly 60s. This might affect short compliance.`
      );
    }

    if (!summary || !cutscenes.length) {
      fs.writeFileSync("error-gpt-response.txt", raw); // 오류 추적용
      throw new Error("요약 또는 컷신 파싱 실패");
    }

    await db.collection("stories").doc("currentStory").set({
      createdAt: Date.now(),
      character: selectedCharacter,
      prompt, // 사용자 입력 프롬프트 (스토리 테마)
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
