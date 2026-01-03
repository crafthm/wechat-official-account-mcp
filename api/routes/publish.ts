/**
 * 发布相关 API 路由
 */
import { Router, type Request, type Response } from 'express';
import { AuthManager } from '../../src/auth/auth-manager.js';
import { WechatApiClient } from '../../src/wechat/api-client.js';
import { StorageManager } from '../../src/storage/storage-manager.js';

const router = Router();

// 初始化管理器（单例模式）
let authManager: AuthManager | null = null;
let apiClient: WechatApiClient | null = null;
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
  
  if (!apiClient) {
    apiClient = new WechatApiClient(authManager);
  }
  
  return { authManager, apiClient, storageManager };
}

/**
 * 上传封面图到永久素材库
 * POST /api/publish/upload-thumb
 */
router.post('/upload-thumb', async (req: Request, res: Response) => {
  try {
    const { fileData, fileName } = req.body;
    
    if (!fileData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'fileData 和 fileName 不能为空',
      });
    }
    
    const { apiClient: client } = await initializeManagers();
    
    // 将 base64 转换为 Buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // 上传到永久素材库
    const result = await client!.uploadMedia({
      type: 'image',
      media: buffer,
      fileName,
    });
    
    res.json({
      success: true,
      data: {
        mediaId: result.mediaId,
      },
    });
  } catch (error) {
    console.error('上传封面图失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '上传封面图失败',
    });
  }
});

/**
 * 发布文章
 * POST /api/publish/submit
 * 
 * 请求参数说明：
 * - mediaId: 草稿ID（可选，如果提供则直接发布该草稿）
 * - title: 文章标题（创建新草稿时必需）
 * - content: 文章内容HTML（创建新草稿时必需）
 * - thumbMediaId: 封面图片媒体ID（创建新草稿时必需）
 * - author: 作者名称（可选）
 * - digest: 文章摘要，最多120字（可选，不填则自动抓取正文开头）
 * - contentSourceUrl: 原文链接（可选）
 * - showCoverPic: 是否在文章中显示封面（0/1，默认1）
 * - needOpenComment: 是否开启留言（0/1，默认0）
 * - onlyFansCanComment: 是否仅粉丝可评论（0/1，默认0，需先开启留言）
 * - isOriginal: 是否声明原创（0/1，默认0）
 *   * 需要公众号已开通原创声明功能，否则会返回错误码85079
 *   * 开通条件：持续发布原创内容，通常要求近3个月发布至少5篇原创文章
 * - originalSourceUrl: 原文链接（声明原创时可选，如果文章在其他平台首发可填写）
 * 
 * 注意：
 * - 赞赏功能无法通过API配置，需要在微信公众平台后台开通
 * - 赞赏功能开通条件：完成微信认证、签署协议、绑定收款账户、发布至少5篇原创文章
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { 
      mediaId, 
      title, 
      content, 
      thumbMediaId, 
      author, 
      digest,
      contentSourceUrl,
      showCoverPic = 1,
      needOpenComment = 0,
      onlyFansCanComment = 0,
      isOriginal = 0,
      originalSourceUrl,
    } = req.body;
    
    if (!mediaId && !content) {
      return res.status(400).json({
        success: false,
        message: 'mediaId 或 content 不能为空',
      });
    }
    
    const { apiClient: client } = await initializeManagers();
    
    let finalMediaId = mediaId;
    
    // 如果没有 mediaId，需要先创建草稿
    if (!finalMediaId) {
      if (!title || !content || !thumbMediaId) {
        return res.status(400).json({
          success: false,
          message: '创建草稿需要 title、content 和 thumbMediaId',
        });
      }
      
      // 创建草稿（需要转换为微信 API 格式）
      const articles = [{
        title,
        author: author || '',
        digest: digest || '',
        content,
        contentSourceUrl: contentSourceUrl || '',
        thumbMediaId: thumbMediaId,
        showCoverPic: showCoverPic !== undefined ? showCoverPic : 1,
        needOpenComment: needOpenComment !== undefined ? needOpenComment : 0,
        onlyFansCanComment: onlyFansCanComment !== undefined ? onlyFansCanComment : 0,
        // 原创声明配置
        isOriginal: isOriginal !== undefined ? isOriginal : 0,
        originalSourceUrl: originalSourceUrl || '',
      }];
      
      // 使用 API 客户端创建草稿（会自动转换格式）
      // 注意：如果设置了 isOriginal=1 但公众号未开通原创声明功能，会返回错误码85079
      const draftResult = await client!.addDraft(articles);
      
      finalMediaId = draftResult.mediaId;
    }
    
    // 发布草稿
    const publishResult = await client!.publishDraft(finalMediaId);
    
    res.json({
      success: true,
      data: {
        publishId: publishResult.publishId,
        msgDataId: publishResult.msgDataId,
        mediaId: finalMediaId,
      },
    });
  } catch (error) {
    console.error('发布失败:', error);
    
    // 处理特定错误码
    let errorMessage = error instanceof Error ? error.message : '发布失败';
    if (errorMessage.includes('85079')) {
      errorMessage = '发布失败：公众号未开通原创声明功能。请在微信公众平台后台申请开通原创声明功能。';
    } else if (errorMessage.includes('85080')) {
      errorMessage = '发布失败：公众号未开通付费功能。';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

export default router;

