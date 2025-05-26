// client/src/views/ImagePage.jsx
import React, { useEffect, useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { characterOptions } from "../constants/characterOptions";
import { styleOptions } from "../constants/styleOptions";
import { fetchCurrentStory } from "../api/fetchCurrentStory";

const ImagePage = () => {
  const {
    cutsceneList,
    setCutsceneList,
    selectedCharacter,
    setSelectedCharacter,
    imageStyle,
    setImageStyle,
    setStorySummary,
  } = useWorkflowStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState({});

  useEffect(() => {
    async function loadFromFirestore() {
      const data = await fetchCurrentStory();
      if (data) {
        setSelectedCharacter(data.character);
        setStorySummary(data.summary);
        setCutsceneList(data.cutscenes);
        // 이미 생성된 이미지가 있다면 images 상태에 추가
        const existingImages = {};
        data.cutscenes.forEach((cut) => {
          if (cut.imageUrl) {
            existingImages[cut.scene] = cut.imageUrl;
          }
        });
        setImages((prev) => ({ ...prev, ...existingImages }));
      }
    }
    loadFromFirestore();
  }, []);

  const character = characterOptions.find((c) => c.value === selectedCharacter);

  if (!character) {
    return (
      <div className="p-8 text-center text-gray-500">
        ⚠️ 캐릭터 정보가 없습니다. 먼저 스토리를 생성해주세요.
      </div>
    );
  }

  const handleImageGenerate = async (sceneId) => {
    // ✨ 컷씬 ID만 받도록 변경
    setIsGenerating(true);
    try {
      // ✨ 백엔드 서버의 새로운 엔드포인트 호출
      const res = await fetch("http://localhost:4000/image/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: sceneId,
          character: selectedCharacter, // 현재 선택된 캐릭터도 함께 전달
          style: imageStyle, // 현재 선택된 스타일도 함께 전달
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `서버 오류: ${res.statusText || res.status}, ${errorData.error || ""}`
        );
      }

      const data = await res.json();
      // 백엔드에서 받은 이미지 URL로 상태 업데이트
      setImages((prev) => ({ ...prev, [sceneId]: data.imageUrl }));

      // Firestore에서 업데이트된 최신 데이터를 다시 불러와 cutsceneList 갱신
      const updatedStoryData = await fetchCurrentStory();
      if (updatedStoryData) {
        setCutsceneList(updatedStoryData.cutscenes);
      }
    } catch (err) {
      console.error("❌ 이미지 생성 요청 실패:", err);
      alert(`이미지 생성 실패: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    for (const cut of cutsceneList) {
      await handleImageGenerate(cut.scene); // ✨ 컷씬 ID만 전달
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex gap-6">
      {/* 왼쪽 설정 */}
      <div className="w-1/4 space-y-4">
        {/* 주인공 요약 */}
        <div className="bg-white rounded-xl p-4 shadow text-center space-y-2">
          <h3 className="text-sm font-semibold">선택된 주인공</h3>
          <img
            src={character.image}
            className="w-20 h-20 mx-auto"
            alt="캐릭터"
          />
          <p className="text-sm text-gray-700">{character.label}</p>
        </div>

        {/* 스타일 선택 */}
        <div className="bg-white p-5 rounded-2xl shadow space-y-3">
          <h2 className="text-sm font-semibold">스타일 선택</h2>
          <div className="grid grid-cols-2 gap-2">
            {styleOptions.map((style) => (
              <div
                key={style.value}
                onClick={() => setImageStyle(style.value)}
                className={`cursor-pointer border text-xs text-center py-2 rounded-xl hover:bg-gray-50 transition ${
                  imageStyle === style.value
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={style.image}
                  className="w-15 h-15 mx-auto"
                  alt="캐릭터"
                />
                {style.label}
              </div>
            ))}
          </div>
        </div>

        {/* 전체 생성 */}
        <button
          onClick={handleBatchGenerate}
          disabled={isGenerating}
          className="w-full py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition"
        >
          {isGenerating ? "전체 생성 중..." : "전체 생성"}
        </button>
      </div>

      {/* 오른쪽 컷 씬 목록 */}
      <div className="w-3/4">
        <h2 className="text-xl font-bold mb-4">
          🖼️ 이미지 생성 (컷 {cutsceneList.length}개)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {cutsceneList.map((cut) => (
            <div
              key={cut.scene}
              className="bg-white p-4 rounded-xl shadow border flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-blue-600 mb-1">
                  장면 {cut.scene}
                </h3>
                <p className="text-sm text-gray-700 mb-3">{cut.image_prompt}</p>
              </div>
              <button
                className="bg-black text-white py-1 px-3 rounded hover:bg-gray-800 text-sm"
                onClick={() => handleImageGenerate(cut.scene)} // ✨ 컷씬 ID만 전달
                disabled={isGenerating || images[cut.scene]}
              >
                {images[cut.scene] ? "이미지 생성 완료" : "이미지 생성"}
              </button>

              {(images[cut.scene] || cut.imageUrl) && (
                <img
                  src={images[cut.scene] || cut.imageUrl}
                  alt={`장면 ${cut.scene} 생성된 이미지`}
                  className="mt-3 w-full rounded"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImagePage;
