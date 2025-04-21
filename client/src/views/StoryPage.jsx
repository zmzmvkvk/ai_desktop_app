import { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { generateStoryWithImage } from "../api/story";
import { characterOptions } from "../constants/characterOptions";

export default function StoryPage() {
  const {
    storyPrompt,
    setStoryPrompt,
    imageFile,
    imagePreview,
    setImage,
    selectedCharacter,
    setSelectedCharacter,
    storySummary,
    setStorySummary,
    cutsceneList,
    setCutsceneList,
  } = useWorkflowStore();

  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setImage(file, URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file, URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!imageFile) return alert("이미지를 업로드해주세요!");
    setLoading(true);
    try {
      const result = await generateStoryWithImage(
        imageFile,
        storyPrompt,
        selectedCharacter
      );
      setStorySummary(result.summary || result.raw?.summary || "");
      setCutsceneList(result.cutscenes || result.raw?.cutscenes || []);
    } catch (err) {
      console.error("스토리 생성 실패:", err);
      const message =
        err.response?.data?.message || err.message || "알 수 없는 오류";
      const tip = err.response?.data?.tip;
      alert(`스토리 생성 실패:\n${message}\n\n💡 ${tip || ""}`);
    } finally {
      setLoading(false);
    }
  };

  const totalSeconds = (cutsceneList || []).reduce(
    (acc, cur) => acc + parseFloat(cur.video_time || 0),
    0
  );

  return (
    <div className="flex gap-8">
      {/* 왼쪽 설정 */}
      <div className="w-1/3 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-semibold">프롬프트 설정</h2>

          {/* 캐릭터 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              주인공 선택
            </label>
            <div className="grid grid-cols-2 gap-4">
              {characterOptions.map((char) => (
                <div
                  key={char.value}
                  onClick={() => setSelectedCharacter(char.value)}
                  className={`cursor-pointer p-2 rounded-xl border ${
                    selectedCharacter === char.value
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : "border-gray-300"
                  }`}
                >
                  <img
                    src={char.image}
                    alt={char.label}
                    className="w-full h-20 object-contain"
                  />
                  <p className="text-center text-xs mt-1">{char.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full h-48 border-2 rounded-lg flex items-center justify-center transition ${
              isDragging
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-dashed border-gray-300 text-gray-400"
            } relative cursor-pointer hover:border-blue-400 hover:text-blue-500`}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <span>
                {isDragging
                  ? "여기에 드롭해서 업로드!"
                  : "클릭하거나 이미지를 드래그하여 업로드"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0"
            />
          </div>

          <textarea
            className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm resize-none"
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            placeholder="예: 스토리 프롬프트 구성"
          />

          <button
            onClick={handleGenerate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold"
            disabled={loading}
          >
            {loading ? "분석 중..." : "스토리 생성"}
          </button>
        </div>
      </div>

      {/* 오른쪽 결과 */}
      <div className="w-2/3 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-2">📘 스토리 요약</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {storySummary}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">
            🎬 컷 씬 카드 (총 {cutsceneList?.length || 0}개 | 총{" "}
            {totalSeconds.toFixed(1)}초)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {(cutsceneList ?? []).map((cut) => (
              <div
                key={cut.scene}
                className="p-4 rounded-xl shadow bg-white border text-sm space-y-2"
              >
                <h4 className="text-blue-600 font-bold">장면 {cut.scene}</h4>
                <p className="text-gray-800 font-medium">{cut.description}</p>
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-1">
                  <p>
                    <b>Camera:</b> {cut.camera || "N/A"}
                  </p>
                  <p>
                    <b>Pose:</b> {cut.pose || "N/A"}
                  </p>
                  <p>
                    <b>Face:</b> {cut.face || "N/A"}
                  </p>
                  <p>
                    <b>Duration:</b> {cut.video_time || "0.0"} sec
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
