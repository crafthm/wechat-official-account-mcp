import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Home as HomeIcon, MessageSquare, Settings } from "lucide-react";
import WechatAccount from "./WechatAccount";

type PageType = "home" | "wechat" | "config";

export default function Home() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>("home");

  const renderContent = () => {
    switch (currentPage) {
      case "home":
        return null;
      case "wechat":
        return (
          <div className="h-full">
            <WechatAccount />
          </div>
        );
      case "config":
        return null; // 配置已移至公众号页面
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex relative">
      {/* 左侧边栏 */}
      {sidebarVisible && (
        <div className="w-16 transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-4">
          {/* 左栏隐藏按钮 */}
          <button
            onClick={() => setSidebarVisible(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="隐藏侧边栏"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>

          {/* 主页按钮 */}
          <button
            onClick={() => setCurrentPage("home")}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              currentPage === "home"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="主页"
          >
            <HomeIcon className="w-5 h-5" />
          </button>

          {/* 公众号按钮 */}
          <button
            onClick={() => setCurrentPage("wechat")}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              currentPage === "wechat"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="公众号"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 侧边栏隐藏时的展开按钮 */}
      {!sidebarVisible && (
        <button
          onClick={() => setSidebarVisible(true)}
          className="absolute left-0 top-4 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          title="显示侧边栏"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentPage === "wechat" ? (
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}