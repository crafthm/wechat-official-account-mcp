import { useState } from "react";
import { 
  Image, 
  Music, 
  Video, 
  Upload, 
  Plus, 
  Settings, 
  Folder,
  Clock,
  FileImage,
  FolderOpen,
  ImageIcon
} from "lucide-react";

type MediaType = "image" | "audio" | "video";
type CategoryType = "group" | "recent" | "my" | "ungrouped" | "article" | "sdai";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  type: MediaType;
  updateTime: number;
  group?: string;
}

export default function MaterialLibrary() {
  const [activeTab, setActiveTab] = useState<MediaType>("image");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("my");
  const [watermark, setWatermark] = useState("溪天云影");
  
  // 模拟数据 - 后续可替换为真实 API 调用
  const mockImages: MediaItem[] = [
    { id: "1", name: "粘贴图片_2025122413311...", url: "", type: "image", updateTime: Date.now() },
    { id: "2", name: "output_3_1.png", url: "", type: "image", updateTime: Date.now() },
    { id: "3", name: "Stable Diffusion_b95aa055...", url: "", type: "image", updateTime: Date.now() },
    { id: "4", name: "Stable Diffusion_aa851595...", url: "", type: "image", updateTime: Date.now() },
    { id: "5", name: "Stable Diffusion_60fa9306...", url: "", type: "image", updateTime: Date.now() },
    { id: "6", name: "Stable Diffusion_2adf6739...", url: "", type: "image", updateTime: Date.now() },
    { id: "7", name: "2014_11_24_10_17_30_86...", url: "", type: "image", updateTime: Date.now() },
    { id: "8", name: "michelin-plaque-2016-760.j...", url: "", type: "image", updateTime: Date.now() },
    { id: "9", name: "p2269845832.jpg", url: "", type: "image", updateTime: Date.now() },
    { id: "10", name: "p2269845994.jpg", url: "", type: "image", updateTime: Date.now() },
    { id: "11", name: "20150428163450354.jpg", url: "", type: "image", updateTime: Date.now() },
    { id: "12", name: "guide-michelin-edition-190...", url: "", type: "image", updateTime: Date.now() },
  ];

  const getMediaList = (): MediaItem[] => {
    // 根据当前标签和分类过滤
    return mockImages.filter(item => item.type === activeTab);
  };

  const getTotalCount = (): number => {
    return mockImages.filter(item => item.type === activeTab).length;
  };

  const getCategoryCount = (category: CategoryType): number => {
    // 模拟不同分类的数量
    const counts: Record<CategoryType, number> = {
      group: 0,
      recent: 8,
      my: 45,
      ungrouped: 6,
      article: 39,
      sdai: 0,
    };
    return counts[category];
  };

  const getCategoryLabel = (category: CategoryType): string => {
    const labels: Record<CategoryType, Record<MediaType, string>> = {
      group: { image: "分组", audio: "分组", video: "分组" },
      recent: { image: "最近使用", audio: "最近使用", video: "最近使用" },
      my: { image: "我的图片", audio: "我的音频", video: "我的视频" },
      ungrouped: { image: "未分组", audio: "未分组", video: "未分组" },
      article: { image: "文章配图", audio: "文章音频", video: "文章视频" },
      sdai: { image: "SDAI", audio: "SDAI", video: "SDAI" },
    };
    return labels[category][activeTab];
  };

  const categories: { key: CategoryType; icon: React.ReactNode }[] = [
    { key: "group", icon: <Folder className="w-4 h-4" /> },
    { key: "recent", icon: <Clock className="w-4 h-4" /> },
    { key: "my", icon: <FileImage className="w-4 h-4" /> },
    { key: "ungrouped", icon: <FolderOpen className="w-4 h-4" /> },
    { key: "article", icon: <ImageIcon className="w-4 h-4" /> },
    { key: "sdai", icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const mediaList = getMediaList();

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 顶部标题和操作区 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              素材库
            </h1>
            
            {/* 右侧操作区 */}
            <div className="flex items-center gap-4">
              {/* 水印设置 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">水印:</span>
                <button className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {watermark}?
                </button>
              </div>
              
              {/* 上传按钮 */}
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                <Upload className="w-4 h-4" />
                上传
              </button>
              
              {/* 新建和管理 */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  新建
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  管理
                </button>
              </div>
            </div>
          </div>

          {/* 导航标签：图片、音频、视频 */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("image")}
              className={`px-4 py-2 flex items-center gap-2 font-medium transition-colors ${
                activeTab === "image"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Image className="w-4 h-4" />
              图片
            </button>
            <button
              onClick={() => setActiveTab("audio")}
              className={`px-4 py-2 flex items-center gap-2 font-medium transition-colors ${
                activeTab === "audio"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Music className="w-4 h-4" />
              音频
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`px-4 py-2 flex items-center gap-2 font-medium transition-colors ${
                activeTab === "video"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Video className="w-4 h-4" />
              视频
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* 分类标签和标题 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab === "image" ? "图片" : activeTab === "audio" ? "音频" : "视频"} (共{getTotalCount()}条)
              </h2>
            </div>
            
            {/* 分类标签 */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => {
                const count = getCategoryCount(category.key);
                const isActive = activeCategory === category.key;
                const label = getCategoryLabel(category.key);
                return (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {category.icon}
                    {label}
                    {count > 0 && (
                      <span className={`${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 素材网格 */}
          <div className="p-6">
            {mediaList.length > 0 ? (
              <div className="grid grid-cols-6 gap-3">
                {mediaList.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-600"
                  >
                    {/* 图片占位符 */}
                    <div className="aspect-square w-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                      {activeTab === "image" ? (
                        <Image className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      ) : activeTab === "audio" ? (
                        <Music className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <Video className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    
                    {/* 文件名显示 */}
                    <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={item.name}>
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  {activeTab === "image" ? (
                    <Image className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  ) : activeTab === "audio" ? (
                    <Music className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Video className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  )}
                  <p className="text-gray-500 dark:text-gray-400">
                    暂无{activeTab === "image" ? "图片" : activeTab === "audio" ? "音频" : "视频"}素材
                  </p>
                  <button className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    上传素材
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

