import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { AuthManager } from '../auth/auth-manager.js';
import { logger } from '../utils/logger.js';

/**
 * 微信公众号 API 客户端
 * 封装微信公众号 API 调用
 */
export class WechatApiClient {
  private authManager: AuthManager;
  private httpClient: AxiosInstance;

  constructor(authManager: AuthManager) {
    this.authManager = authManager;
    this.httpClient = axios.create({
      baseURL: 'https://api.weixin.qq.com',
      timeout: 30000,
    });

    // 请求拦截器：自动添加 access_token
    this.httpClient.interceptors.request.use(async (config) => {
      if (config.url && !config.url.includes('access_token=')) {
        const tokenInfo = await this.authManager.getAccessToken();
        const separator = config.url.includes('?') ? '&' : '?';
        config.url += `${separator}access_token=${tokenInfo.accessToken}`;
      }
      return config;
    });

    // 响应拦截器：处理错误，特别是 access_token 无效的情况
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const errorData = error?.response?.data;
        const errorCode = errorData?.errcode;
        const errorMsg = errorData?.errmsg || '';
        
        // 处理 access_token 无效或过期的错误（40001）
        // 错误消息可能包含：invalid credential, access_token is invalid or not latest
        // 当遇到这个错误时，强制刷新 token 并重试一次
        if (errorCode === 40001 && (
          errorMsg.includes('access_token') || 
          errorMsg.includes('invalid credential') ||
          errorMsg.includes('not latest')
        )) {
          // 检查是否已经重试过（防止无限重试）
          const config = error.config;
          if (config && !config.__retryTokenRefresh) {
            logger.warn('Access token invalid, refreshing and retrying...');
            
            try {
              // 标记为已重试
              config.__retryTokenRefresh = true;
              
              // 清除内存和数据库中的旧 token，确保获取新的稳定版 access_token
              // 稳定版 access_token 和普通 access_token 不兼容，必须清除旧的
              logger.info('Clearing old access token (may be regular token, incompatible with stable token)');
              this.authManager['tokenInfo'] = null;
              await this.authManager['storageManager'].clearAccessToken();
              
              // 强制刷新 token（使用 force_refresh=true）
              // 这会获取新的稳定版 access_token
              logger.info('Force refreshing stable access token due to 40001 error');
              await this.authManager.refreshAccessToken(true);
              
              // 更新 access_token
              const tokenInfo = await this.authManager.getAccessToken();
              // 移除旧的 access_token（如果存在）
              config.url = config.url.replace(/[?&]access_token=[^&]*/, '');
              config.url += `${config.url.includes('?') ? '&' : '?'}access_token=${tokenInfo.accessToken}`;
              
              // 重试请求
              return this.httpClient.request(config);
            } catch (refreshError) {
              logger.error('Failed to refresh token and retry:', refreshError);
              throw new Error(`Access token 无效，且刷新失败: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
            }
          }
        }
        
        logger.error('Wechat API request failed:', status ? String(status) : error?.message);
        throw error;
      }
    );
  }

  getAuthManager(): AuthManager {
    return this.authManager;
  }

  /**
   * 上传临时素材
   */
  async uploadMedia(params: {
    type: 'image' | 'voice' | 'video' | 'thumb';
    media: Buffer;
    fileName: string;
    title?: string;
    introduction?: string;
  }): Promise<{ mediaId: string; type: string; createdAt: number; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('media', params.media, params.fileName);
      
      if (params.type === 'video') {
        const description = {
          title: params.title || 'Video',
          introduction: params.introduction || '',
        };
        formData.append('description', JSON.stringify(description));
      }

      const response = await this.httpClient.post(
        `/cgi-bin/media/upload?type=${params.type}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      if (response.data.errcode) {
        throw new Error(`Upload failed: ${response.data.errmsg} (${response.data.errcode})`);
      }

      return {
        mediaId: response.data.media_id,
        type: response.data.type,
        createdAt: response.data.created_at * 1000,
        url: response.data.url,
      };
    } catch (error) {
      logger.error('Failed to upload media:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 获取临时素材
   */
  async getMedia(mediaId: string): Promise<Buffer> {
    try {
      const response = await this.httpClient.get(
        `/cgi-bin/media/get?media_id=${mediaId}`,
        {
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Failed to get media:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 新增永久图文素材
   */
  async addNews(articles: Array<{
    title: string;
    author?: string;
    digest?: string;
    content: string;
    contentSourceUrl?: string;
    thumbMediaId: string;
    showCoverPic?: number;
    needOpenComment?: number;
    onlyFansCanComment?: number;
    isOriginal?: number;
    originalSourceUrl?: string;
  }>): Promise<{ mediaId: string }> {
    try {
      const response = await this.httpClient.post('/cgi-bin/material/add_news', {
        articles: articles.map(article => ({
          title: article.title,
          author: article.author || '',
          digest: article.digest || '',
          content: article.content,
          content_source_url: article.contentSourceUrl || '',
          thumb_media_id: article.thumbMediaId,
          show_cover_pic: article.showCoverPic !== undefined ? article.showCoverPic : 0,
          need_open_comment: article.needOpenComment !== undefined ? article.needOpenComment : 0,
          only_fans_can_comment: article.onlyFansCanComment !== undefined ? article.onlyFansCanComment : 0,
          is_original: article.isOriginal !== undefined ? article.isOriginal : 0,
          original_source_url: article.originalSourceUrl || '',
        })),
      });

      if (response.data.errcode) {
        throw new Error(`Add news failed: ${response.data.errmsg} (${response.data.errcode})`);
      }

      return {
        mediaId: response.data.media_id,
      };
    } catch (error) {
      logger.error('Failed to add news:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 新增草稿
   */
  async addDraft(articles: Array<{
    title: string;
    author?: string;
    digest?: string;
    content: string;
    contentSourceUrl?: string;
    thumbMediaId: string;
    showCoverPic?: number;
    needOpenComment?: number;
    onlyFansCanComment?: number;
    isOriginal?: number;
    originalSourceUrl?: string;
  }>): Promise<{ mediaId: string }> {
    try {
      const response = await this.httpClient.post('/cgi-bin/draft/add', {
        articles: articles.map(article => ({
          title: article.title,
          author: article.author || '',
          digest: article.digest || '',
          content: article.content,
          content_source_url: article.contentSourceUrl || '',
          thumb_media_id: article.thumbMediaId,
          show_cover_pic: article.showCoverPic !== undefined ? article.showCoverPic : 0,
          need_open_comment: article.needOpenComment !== undefined ? article.needOpenComment : 0,
          only_fans_can_comment: article.onlyFansCanComment !== undefined ? article.onlyFansCanComment : 0,
          is_original: article.isOriginal !== undefined ? article.isOriginal : 0,
          original_source_url: article.originalSourceUrl || '',
        })),
      });

      if (response.data.errcode) {
        throw new Error(`Add draft failed: ${response.data.errmsg} (${response.data.errcode})`);
      }

      return {
        mediaId: response.data.media_id,
      };
    } catch (error) {
      logger.error('Failed to add draft:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 更新草稿
   */
  async updateDraft(params: {
    mediaId: string;
    index: number; // 要更新的文章索引，从0开始
    article: {
      title: string;
      author?: string;
      digest?: string;
      content: string;
      contentSourceUrl?: string;
      thumbMediaId: string;
      showCoverPic?: number;
      needOpenComment?: number;
      onlyFansCanComment?: number;
      isOriginal?: number;
      originalSourceUrl?: string;
    };
  }): Promise<void> {
    try {
      const response = await this.httpClient.post('/cgi-bin/draft/update', {
        media_id: params.mediaId,
        index: params.index,
        articles: {
          article_type: 'news',
          title: params.article.title,
          author: params.article.author || '',
          digest: params.article.digest || '',
          content: params.article.content,
          content_source_url: params.article.contentSourceUrl || '',
          thumb_media_id: params.article.thumbMediaId,
          show_cover_pic: params.article.showCoverPic !== undefined ? params.article.showCoverPic : 0,
          need_open_comment: params.article.needOpenComment !== undefined ? params.article.needOpenComment : 0,
          only_fans_can_comment: params.article.onlyFansCanComment !== undefined ? params.article.onlyFansCanComment : 0,
          is_original: params.article.isOriginal !== undefined ? params.article.isOriginal : 0,
          original_source_url: params.article.originalSourceUrl || '',
        },
      });

      if (response.data.errcode) {
        throw new Error(`Update draft failed: ${response.data.errmsg} (${response.data.errcode})`);
      }
    } catch (error) {
      logger.error('Failed to update draft:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 发布接口
   */
  async publishDraft(mediaId: string): Promise<{ publishId: string; msgDataId: string }> {
    try {
      const response = await this.httpClient.post('/cgi-bin/freepublish/submit', {
        media_id: mediaId,
      });

      if (response.data.errcode) {
        throw new Error(`Publish failed: ${response.data.errmsg} (${response.data.errcode})`);
      }

      return {
        publishId: response.data.publish_id,
        msgDataId: response.data.msg_data_id,
      };
    } catch (error) {
      logger.error('Failed to publish draft:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 上传永久素材
   */
  async uploadPermanentMedia(params: {
    type: 'image' | 'voice' | 'video' | 'thumb';
    media: Buffer;
    fileName: string;
    title?: string;
    introduction?: string;
  }): Promise<{ mediaId: string; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('media', params.media, params.fileName);
      
      if (params.type === 'video' && (params.title || params.introduction)) {
        const description = {
          title: params.title || 'Video',
          introduction: params.introduction || '',
        };
        formData.append('description', JSON.stringify(description));
      }

      const response = await this.httpClient.post(
        `/cgi-bin/material/add_material?type=${params.type}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      if (response.data.errcode) {
        throw new Error(`Upload permanent media failed: ${response.data.errmsg} (${response.data.errcode})`);
      }

      return {
        mediaId: response.data.media_id,
        url: response.data.url,
      };
    } catch (error) {
      logger.error('Failed to upload permanent media:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 上传图文消息图片
   */
  async uploadImg(formData: FormData): Promise<{ url: string; errcode?: number; errmsg?: string }> {
    try {
      const response = await this.httpClient.post(
        '/cgi-bin/media/uploadimg',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to upload image:', (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 通用 GET 请求
   */
  async get(path: string, params?: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await this.httpClient.get(path, { params });
      
      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`API Error: ${response.data.errmsg} (${response.data.errcode})`);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`GET ${path} failed:`, (error as any)?.message ?? String(error));
      throw error;
    }
  }

  /**
   * 通用 POST 请求
   */
  async post(path: string, data?: unknown): Promise<unknown> {
    try {
      const response = await this.httpClient.post(path, data);
      
      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`API Error: ${response.data.errmsg} (${response.data.errcode})`);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`POST ${path} failed:`, (error as any)?.message ?? String(error));
      throw error;
    }
  }
}