import axios from "axios";

export async function generateStoryWithImage(file, prompt, selectedCharacter) {
  const form = new FormData();
  form.append("image", file);
  form.append("prompt", prompt);
  form.append("selectedCharacter", selectedCharacter); // ✅ 이건 이제 파라미터로 들어옴

  const res = await axios.post("http://localhost:4000/story/vision", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}
