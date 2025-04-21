import express from "express";
import { generateImagesFromCutscenes } from "../comfy/runCutscene.js";

const router = express.Router();

router.post("/cutscene/generate", async (req, res) => {
  const { jsonPath } = req.body;

  try {
    await generateImagesFromCutscenes(jsonPath);
    res.send("✅ 컷씬 이미지 생성 요청 완료");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ 컷씬 생성 실패");
  }
});

export default router;
