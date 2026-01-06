import { useState } from "react";
import { Settings } from "lucide-react";
import Config from "./Config";

type MenuType = "config";

export default function WechatAccount() {
  const [currentMenu, setCurrentMenu] = useState<MenuType>("config");

  const renderContent = () => {
    switch (currentMenu) {
      case "config":
        return <Config />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* 左侧菜单栏 */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* 菜单标题 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            公众号管理
          </h2>
        </div>

        {/* 菜单项 */}
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {/* 公众号配置 */}
            <button
              onClick={() => setCurrentMenu("config")}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left ${
                currentMenu === "config"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Settings className="w-5 h-5 mr-3" />
              <span className="font-medium">公众号配置</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

