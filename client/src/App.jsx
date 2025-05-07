import { useWorkflowStore } from "./store/workflowStore";
import StoryPage from "./views/StoryPage";
import ImagePage from "./views/ImagePage";
import VideoPage from "./views/VideoPage";
import ResultPage from "./views/ResultPage";
import Sidebar from "./components/SideBar";

export default function App() {
  const { step } = useWorkflowStore();

  const renderPage = () => {
    switch (step) {
      case "스토리":
        return <StoryPage />;
      case "이미지":
        return <ImagePage />;
      case "영상":
        return <VideoPage />;
      case "결과":
        return <ResultPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-white text-gray-800 font-sans relative">
      {/* 고정 사이드바 */}
      <div className="md:block hidden w-60">
        <Sidebar alwaysVisible />
      </div>

      {/* 모바일 사이드바는 fixed 위치 */}
      <Sidebar />

      {/* 본문 */}
      <main className="flex-1 p-6 md:ml-0">{renderPage()}</main>
    </div>
  );
}
