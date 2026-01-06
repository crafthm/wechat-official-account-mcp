import { WechatConfig, AccessTokenInfo } from '../mcp-tool/types.js';
import { StorageManager } from '../storage/storage-manager.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

/**
 * 微信公众号认证管理器
 * 负责管理 AppID、AppSecret 和 Access Token
 */
export class AuthManager {
  private storageManager: StorageManager;
  private config: WechatConfig | null = null;
  private tokenInfo: AccessTokenInfo | null = null;

  constructor() {
    this.storageManager = new StorageManager();
  }

  /**
   * 初始化认证管理器
   */
  async initialize(): Promise<void> {
    await this.storageManager.initialize();
    
    // 加载配置
    this.config = await this.storageManager.getConfig();
    
    // 加载 Access Token
    this.tokenInfo = await this.storageManager.getAccessToken();
    
    // 如果存在旧的普通 access_token，清除它以确保使用稳定版 access_token
    // 稳定版 access_token 和普通 access_token 不兼容，需要重新获取
    if (this.tokenInfo) {
      logger.info('Found existing access token, will use stable access token API for refresh');
    }
    
    logger.info('AuthManager initialized');
  }

  /**
   * 设置微信公众号配置
   */
  async setConfig(config: WechatConfig): Promise<void> {
    this.config = config;
    await this.storageManager.saveConfig(config);
    
    // 配置更新后清除旧的 Access Token
    this.tokenInfo = null;
    await this.storageManager.clearAccessToken();
    
    logger.info('Wechat config updated');
  }

  /**
   * 获取微信公众号配置
   */
  async getConfig(): Promise<WechatConfig | null> {
    if (!this.config) {
      this.config = await this.storageManager.getConfig();
    }
    return this.config;
  }

  /**
   * 获取有效的 Access Token
   */
  async getAccessToken(): Promise<AccessTokenInfo> {
    // 检查是否有有效的 Token
    // 注意：即使 token 未过期，如果是从普通 access_token API 获取的，也应该刷新为稳定版
    if (this.tokenInfo && this.tokenInfo.expiresAt > Date.now() + 60000) { // 提前1分钟刷新
      return this.tokenInfo;
    }

    // 刷新 Token（使用稳定版 access_token）
    return await this.refreshAccessToken();
  }

  /**
   * 刷新 Access Token（使用稳定版 access_token，失败时回退到普通 access_token）
   * 稳定版 access_token 更稳定，不会频繁过期，推荐使用
   * @param forceRefresh 是否强制刷新（默认 false）
   */
  async refreshAccessToken(forceRefresh: boolean = false): Promise<AccessTokenInfo> {
    if (!this.config) {
      throw new Error('Wechat config not found. Please configure first.');
    }

    try {
      // 如果强制刷新，先清除旧的 token（可能是普通 access_token）
      if (forceRefresh) {
        logger.info('Force refresh requested, clearing old token');
        this.tokenInfo = null;
        await this.storageManager.clearAccessToken();
      }
      
      // 先尝试使用稳定版 access_token API
      // 参考：https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/getStableAccessToken.html
      const forceRefreshValue = forceRefresh ? 1 : 0;
      logger.info(`Requesting stable access token (force_refresh: ${forceRefreshValue}, appid: ${this.config.appId.substring(0, 8)}...)`);
      
      // 构建请求体，确保参数类型正确
      const requestBody = {
        grant_type: 'client_credential',
        appid: String(this.config.appId).trim(),
        secret: String(this.config.appSecret).trim(),
        force_refresh: forceRefreshValue, // 数字类型：0 或 1
      };
      
      try {
        const response = await axios.post('https://api.weixin.qq.com/cgi-bin/stable_token', requestBody, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.data.errcode) {
          const errorMsg = response.data.errmsg || 'Unknown error';
          const errorCode = response.data.errcode;
          
          // 处理 47001 数据格式错误 - 回退到普通 access_token API
          if (errorCode === 47001) {
            logger.warn(`Stable token API returned 47001 (data format error), falling back to regular access_token API. Error: ${errorMsg}`);
            // 回退到普通 access_token API
            return await this.refreshAccessTokenRegular();
          }
          
          // 处理 IP 白名单错误
          if (errorMsg.includes('not in whitelist') || errorMsg.includes('invalid ip')) {
            const ipMatch = errorMsg.match(/invalid ip\s+(\d+\.\d+\.\d+\.\d+)/i);
            const extractedIp = ipMatch ? ipMatch[1] : '未知';
            throw new Error(
              `IP 白名单限制：服务器 IP ${extractedIp} 未在微信公众号后台的 IP 白名单中。\n\n` +
              `解决方法：\n` +
              `1. 登录微信公众平台 (https://mp.weixin.qq.com)\n` +
              `2. 进入"开发" -> "基本配置" -> "IP白名单"\n` +
              `3. 添加服务器 IP: ${extractedIp}\n` +
              `4. 保存后等待几分钟生效\n\n` +
              `错误详情: ${errorMsg} (${errorCode})`
            );
          }
          
          throw new Error(`Failed to get stable access token: ${errorMsg} (${errorCode})`);
        }

        // 检查响应数据格式
        if (!response.data || !response.data.access_token) {
          logger.warn('Invalid response from stable token API, falling back to regular access_token API');
          return await this.refreshAccessTokenRegular();
        }

        const { access_token, expires_in } = response.data;
        // 稳定版 access_token 的有效期通常是 7200 秒（2小时），但可能更长
        const expiresAt = Date.now() + (expires_in * 1000);

        this.tokenInfo = {
          accessToken: access_token,
          expiresIn: expires_in,
          expiresAt,
        };

        // 保存到存储
        await this.storageManager.saveAccessToken(this.tokenInfo);
        
        logger.info('Stable access token refreshed successfully');
        return this.tokenInfo;
      } catch (stableTokenError: any) {
        // 如果是 47001 错误或其他可恢复的错误，回退到普通 access_token API
        if (stableTokenError?.response?.data?.errcode === 47001 || 
            (stableTokenError?.message && stableTokenError.message.includes('47001'))) {
          logger.warn('Stable token API failed with 47001, falling back to regular access_token API');
          return await this.refreshAccessTokenRegular();
        }
        // 其他错误直接抛出
        throw stableTokenError;
      }
    } catch (error) {
      logger.error('Failed to refresh stable access token:', error);
      // 如果稳定版 API 完全失败，尝试回退到普通 access_token API
      if (error instanceof Error && !error.message.includes('Wechat config not found')) {
        logger.warn('Stable token API failed, falling back to regular access_token API');
        try {
          return await this.refreshAccessTokenRegular();
        } catch (fallbackError) {
          logger.error('Fallback to regular access_token API also failed:', fallbackError);
          throw error; // 抛出原始错误
        }
      }
      throw error;
    }
  }

  /**
   * 使用普通 access_token API 刷新 Token（回退方案）
   * 当稳定版 access_token API 不可用时使用
   */
  private async refreshAccessTokenRegular(): Promise<AccessTokenInfo> {
    if (!this.config) {
      throw new Error('Wechat config not found. Please configure first.');
    }

    logger.info('Using regular access_token API (fallback)');
    
    try {
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: this.config.appId,
          secret: this.config.appSecret,
        },
        timeout: 10000,
      });

      if (response.data.errcode) {
        const errorMsg = response.data.errmsg || 'Unknown error';
        const errorCode = response.data.errcode;
        throw new Error(`Failed to get access token: ${errorMsg} (${errorCode})`);
      }

      const { access_token, expires_in } = response.data;
      const expiresAt = Date.now() + (expires_in * 1000);

      this.tokenInfo = {
        accessToken: access_token,
        expiresIn: expires_in,
        expiresAt,
      };

      // 保存到存储
      await this.storageManager.saveAccessToken(this.tokenInfo);
      
      logger.info('Regular access token refreshed successfully (fallback)');
      return this.tokenInfo;
    } catch (error) {
      logger.error('Failed to refresh regular access token:', error);
      throw error;
    }
  }

  /**
   * 获取稳定版 Access Token（别名方法，与 getAccessToken 功能相同）
   * 为了兼容错误提示中的 getStableAccessToken 方法名
   */
  async getStableAccessToken(): Promise<AccessTokenInfo> {
    return await this.getAccessToken();
  }

  /**
   * 检查配置是否完整
   */
  isConfigured(): boolean {
    return !!(this.config?.appId && this.config?.appSecret);
  }

  /**
   * 清除所有认证信息
   */
  async clearAuth(): Promise<void> {
    this.config = null;
    this.tokenInfo = null;
    await this.storageManager.clearConfig();
    await this.storageManager.clearAccessToken();
    logger.info('Auth cleared');
  }
}