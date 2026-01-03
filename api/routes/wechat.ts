/**
 * 微信公众号配置相关 API 路由
 */
import { Router, type Request, type Response } from 'express';
import axios from 'axios';
import { AuthManager } from '../../src/auth/auth-manager.js';
import { StorageManager } from '../../src/storage/storage-manager.js';

const router = Router();

// 初始化管理器（单例模式）
let authManager: AuthManager | null = null;
let storageManager: StorageManager | null = null;

async function initializeManagers() {
  if (!storageManager) {
    storageManager = new StorageManager();
    await storageManager.initialize();
  }
  
  if (!authManager) {
    authManager = new AuthManager();
    await authManager.initialize();
  }
  
  return { authManager, storageManager };
}

/**
 * 获取微信公众号配置
 * GET /api/wechat/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const { storageManager: storage } = await initializeManagers();
    const config = await storage!.getConfig();
    
    if (!config) {
      return res.json({
        success: true,
        data: null,
      });
    }
    
    res.json({
      success: true,
      data: {
        appId: config.appId,
        appSecret: config.appSecret,
        token: config.token || '',
        encodingAESKey: config.encodingAESKey || '',
      },
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取配置失败',
    });
  }
});

/**
 * 保存微信公众号配置
 * POST /api/wechat/config
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { appId, appSecret, token, encodingAESKey } = req.body;
    
    if (!appId || !appSecret) {
      return res.status(400).json({
        success: false,
        message: 'AppID 和 AppSecret 为必填项',
      });
    }
    
    const { authManager: auth } = await initializeManagers();
    
    await auth!.setConfig({
      appId,
      appSecret,
      token: token || undefined,
      encodingAESKey: encodingAESKey || undefined,
    });
    
    res.json({
      success: true,
      message: '配置保存成功',
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '保存配置失败',
    });
  }
});

/**
 * 测试微信公众号连接
 * POST /api/wechat/test
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    // 添加请求体调试日志
    console.log('收到测试连接请求:', {
      body: req.body,
      bodyType: typeof req.body,
      hasBody: !!req.body,
    });
    
    // 获取并清理参数（去除首尾空格）
    const appId = req.body?.appId?.trim?.() || req.body?.appId || '';
    const appSecret = req.body?.appSecret?.trim?.() || req.body?.appSecret || '';
    
    // 添加调试日志
    console.log('解析后的参数:', { 
      hasAppId: !!appId, 
      hasAppSecret: !!appSecret,
      appIdLength: appId?.length || 0,
      appSecretLength: appSecret?.length || 0,
      appIdPreview: appId ? `${appId.substring(0, 4)}...` : 'empty',
    });
    
    if (!appId || !appSecret) {
      console.log('参数验证失败:', { 
        appId: !!appId, 
        appSecret: !!appSecret,
        appIdValue: appId,
        appSecretValue: appSecret ? '***' : '',
      });
      return res.status(400).json({
        success: false,
        message: 'AppID 和 AppSecret 为必填项',
      });
    }
    
    // 直接调用微信 API 测试连接，不保存到数据库
    try {
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: appId,
          secret: appSecret,
        },
        timeout: 10000,
      });
      
      // 微信 API 在错误时也会返回 HTTP 200，但响应体包含 errcode
      if (response.data.errcode) {
        const errorMsg = response.data.errmsg || '未知错误';
        const errorCode = response.data.errcode;
        console.log('微信 API 返回错误:', { errcode: errorCode, errmsg: errorMsg });
        
        return res.status(400).json({
          success: false,
          message: `连接测试失败: ${errorMsg} (错误码: ${errorCode})`,
        });
      }
      
      // 成功获取 token
      console.log('连接测试成功');
      res.json({
        success: true,
        message: '连接测试成功',
      });
    } catch (axiosError) {
      // 处理 axios 请求错误
      if (axios.isAxiosError(axiosError)) {
        console.error('Axios 错误:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message,
        });
        
        // 如果微信返回了错误响应（通常也是 200，但包含 errcode）
        if (axiosError.response?.data?.errcode) {
          const errorMsg = axiosError.response.data.errmsg || '未知错误';
          const errorCode = axiosError.response.data.errcode;
          return res.status(400).json({
            success: false,
            message: `连接测试失败: ${errorMsg} (错误码: ${errorCode})`,
          });
        }
        
        // 网络错误或其他 HTTP 错误
        let errorMessage = '测试连接失败';
        if (axiosError.code === 'ECONNABORTED') {
          errorMessage = '连接超时，请检查网络连接';
        } else if (axiosError.response?.status) {
          errorMessage = `HTTP 错误: ${axiosError.response.status} ${axiosError.response.statusText || ''}`;
        } else if (axiosError.message) {
          errorMessage = `网络错误: ${axiosError.message}`;
        }
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
        });
      }
      
      // 其他类型的错误
      throw axiosError;
    }
  } catch (error) {
    console.error('测试连接失败 (未捕获的错误):', error);
    const errorMessage = error instanceof Error ? error.message : '测试连接失败';
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

/**
 * 获取服务器实际使用的出口IP
 * GET /api/wechat/server-ip
 */
router.get('/server-ip', async (req: Request, res: Response) => {
  try {
    // 通过访问外部服务检测服务器实际使用的IP
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ifconfig.me/all.json',
      'https://api.ip.sb/ip',
    ];

    for (const service of ipServices) {
      try {
        const response = await axios.get(service, { timeout: 5000 });
        let ip: string | null = null;
        
        if (typeof response.data === 'string') {
          ip = response.data.trim();
        } else if (response.data?.ip) {
          ip = response.data.ip;
        } else if (response.data?.origin) {
          ip = response.data.origin.split(',')[0].trim();
        }
        
        if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          return res.json({
            success: true,
            data: {
              ip,
              source: service,
            },
          });
        }
      } catch (error) {
        // 继续尝试下一个服务
        continue;
      }
    }
    
    res.status(500).json({
      success: false,
      message: '无法检测服务器IP地址',
    });
  } catch (error) {
    console.error('检测服务器IP失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '检测服务器IP失败',
    });
  }
});

export default router;

