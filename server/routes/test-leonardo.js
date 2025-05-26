import dotenv from "dotenv";
import LeonardoAI from "@leonardo-ai/sdk"; // ✅ default import

dotenv.config();

const leonardo = new LeonardoAI(process.env.LEONARDO_API_KEY);

async function testLeonardo() {
  try {
    const prompt =
      "A cute anime girl in a fantasy forest, vibrant, cinematic lighting";
    const modelId = "b24e16ff-06e3-431a-8aff-d6558787c122";
    const styleId = "601e3391-4560-44bd-938a-1a264023774c";

    console.log("📤 Generation 요청 중...");

    const generation = await leonardo.generations.create({
      prompt,
      modelId,
      width: 512,
      height: 512,
      num_images: 1,
      sdVersion: "v1.5",
      presetStyle: styleId,
      promptMagic: true,
    });

    const generationId = generation.sdGenerationJob.generationId;
    console.log("✅ Generation ID:", generationId);

    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 3000;

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise((res) => setTimeout(res, delay));
      const result = await leonardo.generations.getById(generationId);
      const status = result.sdGenerationJob.status;

      console.log(`⏳ [${attempts + 1}] 상태: ${status}`);

      if (status === "COMPLETE") {
        imageUrl = result.sdGenerationJob.generated_images?.[0]?.url;
        break;
      } else if (status === "FAILED") {
        throw new Error("❌ Generation failed.");
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error("생성 실패 또는 타임아웃");
    }

    console.log("🎉 이미지 URL:", imageUrl);
  } catch (err) {
    console.error("❌ 오류:", err.message);
  }
}

testLeonardo();
