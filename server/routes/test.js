// 📁 routes/test.js
import express from "express";
import story from "../last-gpt-response.json" assert { type: "json" };

const router = express.Router();

router.get("/mock-story", (req, res) => {
  res.json(story);
});

export default router;
