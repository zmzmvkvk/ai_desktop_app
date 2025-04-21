import { useState } from "react";
import { Menu } from "lucide-react";
import { useWorkflowStore } from "../store/workflowStore";

const tabs = ["대시보드", "스토리", "이미지", "영상", "결과"];

export default function Sidebar({ alwaysVisible = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const { step, setStep } = useWorkflowStore();

  if (alwaysVisible) {
    // 데스크탑 사이드바
    return (
      <aside className="h-screen bg-white border-r shadow-md p-6 space-y-6 w-60">
        <h1 className="text-2xl font-bold text-blue-600">AI Studio</h1>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStep(tab)}
              className={`block w-full text-left px-4 py-2 rounded-lg font-medium ${
                step === tab
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="mt-4 text-xs text-gray-400">
            상태: <span className="text-green-500">서버 작동중</span>
          </div>
        </nav>
      </aside>
    );
  }

  // 모바일 사이드바 (햄버거로 토글)
  return (
    <>
      {/* 햄버거 버튼 */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white p-2 rounded-md shadow"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* 슬라이드 사이드바 */}
      {isOpen && (
        <div className="fixed top-0 left-0 w-60 h-full bg-white shadow-md z-40 p-6 space-y-4">
          <h1 className="text-xl font-bold text-blue-600">AI Studio</h1>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStep(tab);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium ${
                  step === tab
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="mt-4 text-xs text-gray-400">
              상태: <span className="text-green-500">서버 작동중</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
