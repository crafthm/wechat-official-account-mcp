import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Globe, Copy, Check, ExternalLink } from "lucide-react";
import axios from "axios";

interface WechatConfig {
  appId: string;
  appSecret: string;
  token?: string;
  encodingAESKey?: string;
}

export default function Config() {
  const [config, setConfig] = useState<WechatConfig>({
    appId: "",
    appSecret: "",
    token: "",
    encodingAESKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [detectingIp, setDetectingIp] = useState(false);
  const [ipCopied, setIpCopied] = useState(false);
  const [actualServerIp, setActualServerIp] = useState<string | null>(null);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/wechat/config");
      if (response.data.success && response.data.data) {
        setConfig({
          appId: response.data.data.appId || "",
          appSecret: response.data.data.appSecret || "",
          token: response.data.data.token || "",
          encodingAESKey: response.data.data.encodingAESKey || "",
        });
      }
    } catch (error) {
      // 如果接口不存在，尝试从localStorage加载
      const savedConfig = localStorage.getItem("wechat_config");
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (e) {
          console.error("Failed to parse saved config:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config.appId || !config.appSecret) {
      setMessage({ type: "error", text: "AppID 和 AppSecret 为必填项" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post("/api/wechat/config", config);
      if (response.data.success) {
        setMessage({ type: "success", text: response.data.message || "配置保存成功" });
      } else {
        setMessage({ type: "error", text: response.data.message || "保存配置失败" });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      let errorMessage = "保存配置失败";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessage({ type: "error", text: errorMessage });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.appId || !config.appSecret) {
      setMessage({ type: "error", text: "请先填写 AppID 和 AppSecret" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/wechat/test", {
        appId: config.appId,
        appSecret: config.appSecret,
      });
      if (response.data.success) {
        setMessage({ type: "success", text: response.data.message || "连接测试成功" });
      } else {
        setMessage({ type: "error", text: response.data.message || "连接测试失败" });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      let errorMessage = "连接测试失败";
      
      if (axios.isAxiosError(error)) {
        console.log('Axios 错误详情:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        
        // 如果后端返回了错误消息，使用后端消息
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          
          // 从错误信息中提取实际使用的IP（微信API返回的错误信息中包含IP）
          // 错误格式示例：invalid ip 112.254.203.140 ipv6 ::ffff:112.254.203.140, not in whitelist
          const ipMatch = errorMessage.match(/invalid ip\s+(\d+\.\d+\.\d+\.\d+)/i);
          if (ipMatch && ipMatch[1]) {
            const extractedIp = ipMatch[1];
            setActualServerIp(extractedIp);
            // 在错误消息后添加提示
            errorMessage += `\n\n提示：检测到服务器实际使用的IP是 ${extractedIp}，请将此IP添加到微信公众号后台的IP白名单中。`;
          }
        } else if (error.response?.status === 400) {
          // 400 错误时，尝试从响应体中获取消息
          const responseData = error.response.data;
          if (typeof responseData === 'string') {
            try {
              const parsed = JSON.parse(responseData);
              errorMessage = parsed.message || "请求参数错误，请检查 AppID 和 AppSecret 是否正确填写";
            } catch {
              errorMessage = responseData || "请求参数错误，请检查 AppID 和 AppSecret 是否正确填写";
            }
          } else if (responseData?.message) {
            errorMessage = responseData.message;
          } else {
            errorMessage = "请求参数错误，请检查 AppID 和 AppSecret 是否正确填写";
          }
        } else if (error.response?.status === 500) {
          errorMessage = error.response.data?.message || "服务器错误，请稍后重试";
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMessage({
        type: "error",
        text: errorMessage,
      });
      setTimeout(() => setMessage(null), 8000); // 延长显示时间，因为消息可能较长
    } finally {
      setLoading(false);
    }
  };

  // 检测公网IP（客户端IP）
  const detectPublicIp = async () => {
    setDetectingIp(true);
    setPublicIp(null);
    
    // 尝试多个IP检测服务
    const ipServices = [
      'https://api.ipify.org?format=text',
      'https://ifconfig.me',
      'https://ip.sb',
      'https://icanhazip.com',
    ];

    for (const service of ipServices) {
      try {
        const response = await axios.get(service, { timeout: 5000 });
        const ip = response.data.trim();
        if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          setPublicIp(ip);
          setDetectingIp(false);
          return;
        }
      } catch (error) {
        // 继续尝试下一个服务
        continue;
      }
    }
    
    setMessage({ type: "error", text: "无法检测公网IP，请检查网络连接" });
    setTimeout(() => setMessage(null), 3000);
    setDetectingIp(false);
  };

  // 检测服务器实际使用的IP
  const detectServerIp = async () => {
    setDetectingIp(true);
    setActualServerIp(null);
    
    try {
      const response = await axios.get("/api/wechat/server-ip");
      if (response.data.success && response.data.data?.ip) {
        setActualServerIp(response.data.data.ip);
        setMessage({ type: "success", text: `检测到服务器IP: ${response.data.data.ip}` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "无法检测服务器IP" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "检测服务器IP失败，请稍后重试" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDetectingIp(false);
    }
  };

  // 复制IP到剪贴板
  const copyIpToClipboard = async () => {
    if (!publicIp) return;
    
    try {
      await navigator.clipboard.writeText(publicIp);
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 2000);
    } catch (error) {
      setMessage({ type: "error", text: "复制失败，请手动复制" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              微信公众号配置
            </h1>
          </div>

          <div className="space-y-6">
            {/* AppID */}
            <div>
              <label
                htmlFor="appId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                AppID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="appId"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="请输入微信公众号 AppID"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                在微信公众平台的基本配置中获取
              </p>
            </div>

            {/* AppSecret */}
            <div>
              <label
                htmlFor="appSecret"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                AppSecret <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="appSecret"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="请输入微信公众号 AppSecret"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                在微信公众平台的基本配置中获取，请妥善保管
              </p>
            </div>

            {/* Token */}
            <div>
              <label
                htmlFor="token"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Token <span className="text-gray-500 text-xs">(可选)</span>
              </label>
              <input
                type="text"
                id="token"
                value={config.token || ""}
                onChange={(e) => setConfig({ ...config, token: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="请输入 Token（用于消息验证）"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                用于验证消息来源，在微信公众平台的基本配置中设置
              </p>
            </div>

            {/* EncodingAESKey */}
            <div>
              <label
                htmlFor="encodingAESKey"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                EncodingAESKey <span className="text-gray-500 text-xs">(可选)</span>
              </label>
              <input
                type="text"
                id="encodingAESKey"
                value={config.encodingAESKey || ""}
                onChange={(e) => setConfig({ ...config, encodingAESKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="请输入 EncodingAESKey（用于消息加密）"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                用于消息加解密，在微信公众平台的基本配置中设置
              </p>
            </div>

            {/* 公网IP检测 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                公网IP地址（用于配置微信公众号IP白名单）
              </label>
              
              {/* 服务器实际使用的IP（从错误信息中提取） */}
              {actualServerIp && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <label className="block text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    ⚠️ 服务器实际使用的IP（重要）
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={actualServerIp}
                      readOnly
                      className="flex-1 px-4 py-2 border border-yellow-300 dark:border-yellow-700 rounded-lg bg-white dark:bg-gray-800 text-yellow-900 dark:text-yellow-100 font-mono font-semibold"
                    />
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(actualServerIp);
                          setIpCopied(true);
                          setTimeout(() => setIpCopied(false), 2000);
                        } catch (error) {
                          setMessage({ type: "error", text: "复制失败，请手动复制" });
                          setTimeout(() => setMessage(null), 3000);
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      title="复制IP地址"
                    >
                      {ipCopied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                    这是服务器访问微信API时实际使用的IP，请将此IP添加到微信公众号后台的IP白名单中
                  </p>
                </div>
              )}
              
              <button
                onClick={detectServerIp}
                disabled={detectingIp}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                {detectingIp ? "检测中..." : "检测服务器IP"}
              </button>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href="https://developers.weixin.qq.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  前往微信开发者平台配置IP白名单
                </a>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                注意：客户端IP可能与服务器实际使用的IP不同。建议先检测服务器IP，并将该IP添加到微信公众号后台的IP白名单中
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={saveConfig}
                disabled={saving || loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "保存中..." : "保存配置"}
              </button>
              <button
                onClick={testConnection}
                disabled={loading || saving}
                className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                测试连接
              </button>
            </div>
            
            {/* 结果显示 */}
            {message && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* 配置说明 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            配置说明
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              • <strong>AppID</strong> 和 <strong>AppSecret</strong> 是必填项，用于调用微信公众号 API
            </li>
            <li>
              • 这些信息可以在微信公众平台的{" "}
              <strong>开发 &gt; 基本配置</strong> 中找到
            </li>
            <li>
              • <strong>Token</strong> 和 <strong>EncodingAESKey</strong>{" "}
              为可选项，仅在需要接收和验证微信消息时使用
            </li>
            <li>• 配置信息会安全存储在本地，请妥善保管</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

