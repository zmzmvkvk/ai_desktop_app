// client/src/api/fetchCurrentStory.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

/**
 * Firestore에서 현재 저장된 스토리를 불러옴
 * @returns {Promise<{
 *   character: string,
 *   prompt: string,
 *   summary: string,
 *   cutscenes: Array
 * } | null>}
 */
export async function fetchCurrentStory() {
  try {
    const ref = doc(db, "stories", "currentStory");
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (!data.cutscenes || !Array.isArray(data.cutscenes)) {
        console.warn("❗ cutscenes 형식 이상함", data.cutscenes);
        return null;
      }
      return data;
    } else {
      console.warn("❗ Firestore: currentStory 문서 없음");
      return null;
    }
  } catch (err) {
    console.error("🔥 Firestore currentStory 로딩 실패:", err.message);
    return null;
  }
}
