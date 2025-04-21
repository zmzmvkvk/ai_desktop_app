import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import storyRouter from "./routes/story.js";
import testRouter from "./routes/test.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 라우터 연결
app.use("/test", testRouter);
app.use("/story", storyRouter);

app.listen(4000, () => {
  console.log("✅ Server running on http://localhost:4000");
});
