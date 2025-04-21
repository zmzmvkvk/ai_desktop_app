import fs from "fs";
import path from "path";
import axios from "axios";

export async function generateImagesFromCutscenes(jsonPath) {
  const cutscenes = JSON.parse(fs.readFileSync(jsonPath, "utf-8")).cutscenes;

  for (const cut of cutscenes) {
    const prompt = `${cut.description}, gefomen character, cartoon-style, cinematic lighting`;

    await axios.post("http://127.0.0.1:8188/prompt", {
      prompt: {
        10: {
          inputs: {
            positive: prompt,
            seed: Math.floor(Math.random() * 100000),
            // 추가 comfy 파라미터는 여기서 처리
          },
        },
      },
    });

    console.log(`✅ 컷씬 ${cut.scene} 생성 요청 보냄`);
  }
}
