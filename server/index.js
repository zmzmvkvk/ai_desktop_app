import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import storyRouter from "./routes/story.js";
import imageGenerationRouter from "./routes/imageGeneration.js"; // ✨ 새 라우터 임포트

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 라우터 연결
app.use("/story", storyRouter);
app.use("/image", imageGenerationRouter); // ✨ 이미지 생성 라우터 연결

app.listen(4000, () => {
  console.log("✅ Server running on http://localhost:4000");
});
