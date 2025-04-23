import React, { useEffect, useState } from "react";
import { fetchCurrentStory } from "../api/fetchCurrentStory";
import { useWorkflowStore } from "../store/workflowStore";
import { characterOptions } from "../constants/characterOptions";

const VideoPage = () => {
  const {
    cutsceneList,
    setCutsceneList,
    setStorySummary,
    selectedCharacter,
    videoOptions,
    setVideoOptions,
    setSelectedCharacter,
  } = useWorkflowStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const character = characterOptions.find((c) => c.value === selectedCharacter);

  const handleVideoGenerate = async (scene) => {
    setIsGenerating(true);
    console.log("🎬 영상 생성 요청:", scene);
    // TODO: ComfyUI / AnimateDiff API 연동
    setTimeout(() => {
      setIsGenerating(false);
      alert(`장면 ${scene} 영상 생성 완료 (mock)`);
    }, 1000);
  };

  useEffect(() => {
    // 이미 상태에 컷이 있으면 다시 불러올 필요 없음
    if (cutsceneList?.length > 0) return;

    const loadStory = async () => {
      const data = await fetchCurrentStory();
      if (data) {
        setStorySummary(data.summary);
        setCutsceneList(data.cutscenes);
        setSelectedCharacter(data.character);
      }
    };
    loadStory();
  }, []);

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
        <div className="bg-white rounded-xl p-4 shadow text-center space-y-2">
          <h3 className="text-sm font-semibold">선택된 주인공</h3>
          <img
            src={character.image}
            className="w-20 h-20 mx-auto"
            alt="캐릭터"
          />
          <p className="text-sm text-gray-700">{character.label}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-left space-y-4 text-sm">
          <h3 className="text-sm font-semibold">⚙️ 렌더링 옵션</h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={videoOptions.lipsync}
              onChange={(e) => setVideoOptions({ lipsync: e.target.checked })}
            />
            립싱크 사용
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={videoOptions.motionSmoothing}
              onChange={(e) =>
                setVideoOptions({ motionSmoothing: e.target.checked })
              }
            />
            모션 스무딩
          </label>
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
                <p className="text-sm text-gray-700 mb-1">{cut.description}</p>
                <p className="text-xs text-gray-500">
                  ⏱️ 길이: {cut.video_time || 2.0}초
                </p>
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
