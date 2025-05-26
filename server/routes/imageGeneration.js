// server/routes/imageGeneration.js
import express from "express";
import dotenv from "dotenv";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";

dotenv.config();

const router = express.Router();
const db = getFirestore();

router.post("/generate-image", async (req, res) => {
  const { sceneId, character, style } = req.body;

  if (!sceneId || !character || !style) {
    return res.status(400).json({
      error: "필수 정보(sceneId, character, style)가 누락되었습니다.",
    });
  }

  const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
  if (!LEONARDO_API_KEY) {
    console.error("❌ LEONARDO_API_KEY가 .env 파일에 설정되지 않았습니다.");
    return res
      .status(500)
      .json({ error: "서버 설정 오류: API 키가 누락되었습니다." });
  }

  const HEADERS = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${LEONARDO_API_KEY}`,
  };

  try {
    const storyRef = db.collection("stories").doc("currentStory");
    const storySnap = await storyRef.get();

    if (!storySnap.exists) {
      return res.status(404).json({ error: "현재 스토리를 찾을 수 없습니다." });
    }

    const storyData = storySnap.data();
    const cutscenes = storyData.cutscenes;
    const selectedCutscene = cutscenes.find((cut) => cut.scene === sceneId);

    if (!selectedCutscene) {
      return res
        .status(404)
        .json({ error: `장면 ${sceneId}를 찾을 수 없습니다.` });
    }

    const imagePrompt = selectedCutscene.image_prompt;

    let modelId = "b2614463-296c-462a-9586-aafdb8f00e36";
    let styleUUID = "556c1ee5-ec38-42e8-955a-1e82dad0ffa1";

    switch (style) {
      case "simple cartoon":
        styleUUID = "b2a54a51-230b-4d4f-ad4e-8409bf58645f";
        break;
      case "photorealistic":
        styleUUID = "5bdc3f2a-1be6-4d1c-8e77-992a30824a2c";
        break;
      default:
        break;
    }

    // Leonardo AI API 호출 (Step 1: 이미지 생성 요청)
    let url = "https://cloud.leonardo.ai/api/rest/v1/generations";
    let payload = {
      height: 832,
      modelId: modelId,
      prompt: imagePrompt,
      width: 1472,
      num_images: 1,
      styleUUID: styleUUID,
      enhancePrompt: false,
    };

    console.log(
      `✨ Leonardo AI 이미지 생성 요청 (장면 ${sceneId}): "${imagePrompt}"`
    );
    let response = await axios.post(url, payload, { headers: HEADERS });

    console.log("Generate an image request status:", response.status);

    if (
      response.status !== 200 ||
      !response.data?.sdGenerationJob?.generationId
    ) {
      console.error(
        "Leonardo AI 이미지 생성 요청 실패 응답:",
        JSON.stringify(response.data, null, 2)
      );
      throw new Error("이미지 생성 요청 실패: 응답이 올바르지 않습니다.");
    }

    let generationId = response.data.sdGenerationJob.generationId;
    console.log("Generation ID:", generationId);

    // Leonardo AI API 호출 (Step 2: 생성 완료까지 기다린 후 결과 이미지 URL 가져오기)
    url = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;

    console.log("Waiting for image generation to complete...");
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 5000;

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      response = await axios.get(url, { headers: HEADERS });

      // ✨✨✨ 중요 수정: response.data.generations_by_pk로 접근! ✨✨✨
      const job = response.data?.generations_by_pk;

      // 디버깅용 로그 유지 (이제 정확한 정보가 출력될 것입니다)
      console.log(
        `세대 ${generationId} 시도 ${
          attempts + 1
        }/${maxAttempts} - 응답 데이터:`,
        JSON.stringify(response.data, null, 2)
      );

      if (response.status === 200) {
        if (job) {
          console.log(`현재 작업 상태: ${job.status}`);

          if (job.status === "COMPLETE" && job.generated_images?.length > 0) {
            imageUrl = job.generated_images[0].url;
            console.log(`✅ 장면 ${sceneId} 이미지 생성 완료:`, imageUrl);
            break;
          } else if (job.status === "FAILED") {
            console.error(
              `❌ Leonardo AI 이미지 생성 작업 실패 (세대 ID: ${generationId}):`,
              job.failureReason
            );
            throw new Error(
              "이미지 생성 작업 실패: " +
                (job.failureReason || "알 수 없는 이유")
            );
          } else if (job.status === "PENDING" || job.status === "RUNNING") {
            console.log(
              `장면 ${sceneId} 이미지 생성 중 (상태: ${job.status})...`
            );
          } else {
            console.warn(
              `⚠️ 장면 ${sceneId} 예상치 못한 Leonardo AI 응답 상태 또는 구조:`,
              job
            );
          }
        } else {
          console.warn(
            `⚠️ 장면 ${sceneId} generations_by_pk 객체를 찾을 수 없습니다. (응답 구조 확인 필요)`
          );
        }
      } else {
        console.warn(
          `⚠️ 장면 ${sceneId} 이미지 상태 확인 요청 실패 (HTTP ${response.status}):`,
          response.statusText
        );
      }
      attempts++;
    }

    if (!imageUrl) {
      console.error(
        `❌ 장면 ${sceneId}: 이미지 생성 완료까지 기다릴 수 없거나 URL을 찾을 수 없습니다.`
      );
      return res.status(500).json({
        error:
          "이미지 생성 완료 실패 또는 URL을 찾을 수 없습니다. Leonardo AI 웹사이트에서 직접 확인해 주세요.",
      });
    }

    const cutsceneIndex = cutscenes.findIndex((cut) => cut.scene === sceneId);
    if (cutsceneIndex !== -1) {
      cutscenes[cutsceneIndex].imageUrl = imageUrl;
      await storyRef.update({ cutscenes: cutscenes });
    }

    res.status(200).json({ imageUrl: imageUrl });
  } catch (err) {
    console.error(
      "❌ 서버에서 이미지 생성 중 오류 발생:",
      err.response ? JSON.stringify(err.response.data, null, 2) : err.message
    );
    res.status(500).json({
      error: "서버 내부 오류",
      details: err.response ? err.response.data : err.message,
    });
  }
});

export default router;
