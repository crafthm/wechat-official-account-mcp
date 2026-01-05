/**
 * 草稿相关 API 路由
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
 * 获取草稿列表
 * GET /api/draft/list?offset=0&count=20
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const count = parseInt(req.query.count as string) || 20;
    
    const { apiClient: client } = await initializeManagers();
    
    const result = await client!.post('/cgi-bin/draft/batchget', {
      offset,
      count,
    }) as any;
    
    // 格式化草稿列表
    const drafts = result.item.map((item: any) => {
      const firstArticle = item.content.news_item[0];
      const articleCount = item.content.news_item.length;
      
      return {
        mediaId: item.media_id,
        title: firstArticle.title,
        author: firstArticle.author || '',
        digest: firstArticle.digest || '',
        articleCount,
        createTime: item.content.create_time * 1000,
        updateTime: item.content.update_time * 1000,
        thumbMediaId: firstArticle.thumb_media_id,
      };
    });
    
    res.json({
      success: true,
      data: {
        totalCount: result.total_count,
        itemCount: result.item_count,
        drafts,
      },
    });
  } catch (error) {
    console.error('获取草稿列表失败:', error);
    const errorMessage = error instanceof Error ? error.message : '获取草稿列表失败';
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

/**
 * 获取草稿统计
 * GET /api/draft/count
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const { apiClient: client } = await initializeManagers();
    
    const result = await client!.post('/cgi-bin/draft/count') as any;
    
    res.json({
      success: true,
      data: {
        totalCount: result.total_count,
      },
    });
  } catch (error) {
    console.error('获取草稿统计失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取草稿统计失败',
    });
  }
});

/**
 * 获取单个草稿
 * GET /api/draft/get?mediaId=xxx
 */
router.get('/get', async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.query;
    
    if (!mediaId || typeof mediaId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'mediaId 不能为空',
      });
    }
    
    const { apiClient: client } = await initializeManagers();
    
    const result = await client!.post('/cgi-bin/draft/get', {
      media_id: mediaId,
    }) as any;
    
    // 格式化草稿详情
    const draft = {
      mediaId,
      createTime: result.create_time * 1000,
      updateTime: result.update_time * 1000,
      articles: result.news_item.map((item: any) => ({
        title: item.title,
        author: item.author || '',
        digest: item.digest || '',
        content: item.content,
        contentSourceUrl: item.content_source_url || '',
        thumbMediaId: item.thumb_media_id,
        showCoverPic: item.show_cover_pic,
        needOpenComment: item.need_open_comment,
        onlyFansCanComment: item.only_fans_can_comment,
        isOriginal: item.is_original,
        originalSourceUrl: item.original_source_url || '',
      })),
    };
    
    res.json({
      success: true,
      data: draft,
    });
  } catch (error) {
    console.error('获取草稿失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取草稿失败',
    });
  }
});

/**
 * 删除草稿
 * DELETE /api/draft/delete?mediaId=xxx
 */
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.query;
    
    if (!mediaId || typeof mediaId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'mediaId 不能为空',
      });
    }
    
    const { apiClient: client } = await initializeManagers();
    
    await client!.post('/cgi-bin/draft/delete', {
      media_id: mediaId,
    });
    
    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除草稿失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除草稿失败',
    });
  }
});

/**
 * 更新草稿
 * PUT /api/draft/update
 */
router.put('/update', async (req: Request, res: Response) => {
  try {
    const { 
      mediaId,
      index = 0, // 默认更新第一篇文章
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
    
    if (!mediaId || !title || !content || !thumbMediaId) {
      return res.status(400).json({
        success: false,
        message: 'mediaId、title、content 和 thumbMediaId 为必填项',
      });
    }
    
    const { apiClient: client } = await initializeManagers();
    
    // 更新草稿
    await client!.updateDraft({
      mediaId,
      index,
      article: {
        title,
        author: author || '',
        digest: digest || '',
        content,
        contentSourceUrl: contentSourceUrl || '',
        thumbMediaId: thumbMediaId,
        showCoverPic: showCoverPic !== undefined ? showCoverPic : 1,
        needOpenComment: needOpenComment !== undefined ? needOpenComment : 0,
        onlyFansCanComment: onlyFansCanComment !== undefined ? onlyFansCanComment : 0,
        isOriginal: isOriginal !== undefined ? isOriginal : 0,
        originalSourceUrl: originalSourceUrl || '',
      },
    });
    
    res.json({
      success: true,
      message: '草稿更新成功',
    });
  } catch (error) {
    console.error('更新草稿失败:', error);
    
    let errorMessage = error instanceof Error ? error.message : '更新草稿失败';
    if (errorMessage.includes('85079')) {
      errorMessage = '更新失败：公众号未开通原创声明功能。如果未勾选原创声明，请检查其他必填项。';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

/**
 * 保存草稿
 * POST /api/draft/save
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { 
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
    
    if (!title || !content || !thumbMediaId) {
      return res.status(400).json({
        success: false,
        message: 'title、content 和 thumbMediaId 为必填项',
      });
    }
    
    const { apiClient: client } = await initializeManagers();
    
    // 创建草稿
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
      isOriginal: isOriginal !== undefined ? isOriginal : 0,
      originalSourceUrl: originalSourceUrl || '',
    }];
    
    const draftResult = await client!.addDraft(articles);
    
    res.json({
      success: true,
      data: {
        mediaId: draftResult.mediaId,
      },
      message: '草稿保存成功',
    });
  } catch (error) {
    console.error('保存草稿失败:', error);
    
    let errorMessage = error instanceof Error ? error.message : '保存草稿失败';
    if (errorMessage.includes('85079')) {
      errorMessage = '保存失败：公众号未开通原创声明功能。如果未勾选原创声明，请检查其他必填项。';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

export default router;

