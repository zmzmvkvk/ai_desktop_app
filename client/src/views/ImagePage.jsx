import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { characterOptions } from "../constants/characterOptions";
import { styleOptions } from "../constants/styleOptions";

const ImagePage = () => {
  const { cutsceneList, selectedCharacter, imageStyle, setImageStyle } =
    useWorkflowStore();

  const character = characterOptions.find((c) => c.value === selectedCharacter);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageGenerate = async (scene) => {
    setIsGenerating(true);
    console.log("이미지 생성 요청:", scene);
    // TODO: ComfyUI API 요청
    setTimeout(() => {
      setIsGenerating(false);
      alert(`장면 ${scene} 이미지 생성 완료 (mock)`);
    }, 1000);
  };

  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    for (const cut of cutsceneList) {
      await handleImageGenerate(cut.scene);
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
                <p className="text-sm text-gray-700 mb-3">{cut.description}</p>
              </div>
              <button
                className="bg-black text-white py-1 px-3 rounded hover:bg-gray-800 text-sm"
                onClick={() => handleImageGenerate(cut.scene)}
              >
                이미지 생성
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImagePage;
