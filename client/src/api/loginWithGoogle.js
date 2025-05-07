// client/src/api/loginWithGoogle.js
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebaseClient";

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("✅ 로그인 성공:", user.uid);
    return user;
  } catch (err) {
    console.error("❌ 로그인 실패:", err.message);
    throw err;
  }
}
