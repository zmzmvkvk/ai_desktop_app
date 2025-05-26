import { useEffect, useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { generateStoryWithImage } from "../api/story";
import { characterOptions } from "../constants/characterOptions";
import { fetchCurrentStory } from "../api/fetchCurrentStory";

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

  useEffect(() => {
    async function loadStory() {
      const data = await fetchCurrentStory();
      if (data) {
        setStorySummary(data.summary);
        setCutsceneList(data.cutscenes);
        setSelectedCharacter(data.character);
        // 만약 여기에 storyPrompt도 저장했다면 불러올 수 있습니다.
        // setStoryPrompt(data.prompt);
      }
    }
    loadStory();
  }, []);

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
    if (!selectedCharacter) return alert("주인공을 선택해주세요!");
    if (!storyPrompt.trim()) return alert("스토리 프롬프트를 입력해주세요!");

    setLoading(true);
    try {
      const result = await generateStoryWithImage(
        imageFile,
        storyPrompt,
        selectedCharacter
      );

      // 백엔드에서 받은 결과가 직접 summary, cutscenes를 포함하도록 가정
      setStorySummary(result.summary);
      setCutsceneList(result.cutscenes);

      // 디버깅 목적으로 콘솔에 출력하여 파싱 결과 확인
      console.log("Generated Story Summary:", result.summary);
      console.log("Generated Cutscenes:", result.cutscenes);
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

  // 컷씬 목록의 video_time을 정확히 합산
  const totalSeconds = (cutsceneList || []).reduce(
    (acc, cut) => acc + (cut.video_time || 0), // cut.video_time이 이미 숫자로 파싱되었다고 가정
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
            placeholder="예: 스토리 프롬프트 구성 (ex: 잠수 대결에서 승리하는 스토리)"
          />

          <button
            onClick={handleGenerate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold"
            disabled={loading || !selectedCharacter || !storyPrompt.trim()}
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
            {(cutsceneList ?? []).map((cut, index) => {
              const scene = cut.scene ?? index + 1;
              const description = cut.description; // description은 반드시 존재하므로 fallback 필요 없음
              return (
                <div
                  key={scene}
                  className="p-4 rounded-xl shadow bg-white border text-sm space-y-2"
                >
                  <h4 className="text-blue-600 font-bold">장면 {scene}</h4>
                  <p className="text-gray-800 font-medium">{description}</p>
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
                      <b>Duration:</b> {cut.video_time?.toFixed(1) || "N/A"} sec
                    </p>
                    {/* 새로운 필드들 (필요하다면 여기에 추가적으로 표시) */}
                    {/* <p><b>Image Prompt:</b> {cut.image_prompt || "N/A"}</p> */}
                    {/* <p><b>Voice Over:</b> {cut.voice_over_text || "N/A"}</p> */}
                    {/* <p><b>Sound Cue:</b> {cut.sound_effect_cue || "N/A"}</p> */}
                    {/* <p><b>On Screen Text:</b> {cut.on_screen_text || "N/A"}</p> */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
