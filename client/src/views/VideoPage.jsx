import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";

const VideoPage = () => {
  const { cutsceneList } = useWorkflowStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleVideoGenerate = async (scene) => {
    setIsGenerating(true);
    console.log("🎬 영상 생성 요청:", scene);
    // TODO: ComfyUI / AnimateDiff API 연동
    setTimeout(() => {
      setIsGenerating(false);
      alert(`장면 ${scene} 영상 생성 완료 (mock)`);
    }, 1000);
  };

  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    for (const cut of cutsceneList) {
      await handleVideoGenerate(cut.scene);
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex gap-6">
      {/* 왼쪽 설정 */}
      <div className="w-1/4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <h3 className="text-sm font-semibold">⚙️ 립싱크 / 랜더링 옵션</h3>
          <ul className="text-xs text-gray-600 mt-2 list-disc list-inside text-left">
            <li>립싱크 여부 (향후 TTS 모델 연동)</li>
            <li>영상 프레임 수 / 길이 설정</li>
            <li>모션 스무딩 등 향후 추가</li>
          </ul>
        </div>

        <button
          onClick={handleBatchGenerate}
          disabled={isGenerating}
          className="w-full py-2 bg-purple-500 text-white font-semibold rounded-full hover:bg-purple-600 transition"
        >
          {isGenerating ? "전체 생성 중..." : "전체 영상 생성"}
        </button>
      </div>

      {/* 오른쪽 컷 씬별 영상 카드 */}
      <div className="w-3/4">
        <h2 className="text-xl font-bold mb-4">
          🎬 컷 씬 영상 (총 {cutsceneList.length}개)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {cutsceneList.map((cut) => (
            <div
              key={cut.scene}
              className="bg-white p-4 rounded-xl shadow border flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-purple-600 mb-1">
                  장면 {cut.scene}
                </h3>
                <p className="text-sm text-gray-700 mb-3">{cut.description}</p>
              </div>
              <button
                className="bg-black text-white py-1 px-3 rounded hover:bg-gray-800 text-sm"
                onClick={() => handleVideoGenerate(cut.scene)}
              >
                영상 생성
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
