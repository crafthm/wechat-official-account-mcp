import axios from 'axios';
import { toBase64, checkImage } from './validators';
import {
  uploadToGitHub,
  uploadToGitee,
  uploadToAliOSS,
  uploadToTxCOS,
  uploadToQiniu,
  uploadToMinio,
} from './hosts';

export type ImageHost = 'wechat' | 'github' | 'gitee' | 'aliOSS' | 'txCOS' | 'qiniu' | 'minio' | 'custom';

/**
 * 图片上传选项
 */
export interface UploadOptions {
  file: File;
  host?: ImageHost;
  onProgress?: (progress: number) => void;
}

/**
 * 使用微信 API 上传图片
 * @param file - 文件对象
 * @param onProgress - 进度回调
 */
async function uploadToWechat(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 验证图片
  const validation = checkImage(file);
  if (!validation.ok) {
    throw new Error(validation.msg);
  }

  // 转换为 base64
  const base64Content = await toBase64(file);
  
  try {
    // 调用后端 API 上传图片
    const formData = new FormData();
    formData.append('fileData', base64Content);
    formData.append('fileName', file.name);

    const response = await axios.post('/api/upload-img', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    // 从响应中提取图片 URL
    if (response.data && response.data.url) {
      return response.data.url;
    }

    // 如果响应格式不同，尝试其他字段
    if (typeof response.data === 'string') {
      return response.data;
    }

    throw new Error('无法从响应中获取图片 URL');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || error.message || '图片上传失败'
      );
    }
    throw error;
  }
}

/**
 * 获取当前使用的图床
 */
async function getCurrentHost(): Promise<ImageHost> {
  try {
    // 尝试从 API 获取
    const response = await axios.get('/api/image-host/current');
    if (response.data?.success && response.data?.host) {
      return response.data.host as ImageHost;
    }
  } catch {
    // 如果 API 不可用，从 localStorage 获取
  }
  
  // 从 localStorage 获取
  const stored = localStorage.getItem('imageHost');
  return (stored as ImageHost) || 'wechat';
}

/**
 * 获取图床配置
 */
async function getHostConfig(hostType: ImageHost): Promise<Record<string, any> | null> {
  try {
    // 尝试从 API 获取
    const response = await axios.get(`/api/image-host/config/${hostType}`);
    if (response.data?.success && response.data?.config) {
      return response.data.config;
    }
  } catch {
    // 如果 API 不可用，从 localStorage 获取
  }
  
  // 从 localStorage 获取
  const stored = localStorage.getItem(`${hostType}Config`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * 解析 GitHub/Gitee 仓库 URL
 */
function parseRepoUrl(repoUrl: string): { username: string; repo: string } {
  const cleaned = repoUrl
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/^gitee\.com\//, '')
    .split('/');
  
  return {
    username: cleaned[0] || '',
    repo: cleaned[1] || '',
  };
}

/**
 * 上传图片
 * @param options - 上传选项
 */
export async function uploadImage(options: UploadOptions): Promise<string> {
  const { file, host, onProgress } = options;

  // 验证图片
  const validation = checkImage(file);
  if (!validation.ok) {
    throw new Error(validation.msg);
  }

  // 如果没有指定 host，使用当前配置的 host
  const currentHost = host || await getCurrentHost();

  switch (currentHost) {
    case 'wechat':
      return uploadToWechat(file, onProgress);
    
    case 'github': {
      const config = await getHostConfig('github');
      if (!config || !config.repo || !config.accessToken) {
        throw new Error('请先配置 GitHub 图床参数');
      }
      const { username, repo } = parseRepoUrl(config.repo);
      const base64Content = await toBase64(file);
      return uploadToGitHub(base64Content, file.name, {
        username,
        repo,
        branch: config.branch || 'master',
        accessToken: config.accessToken,
      });
    }
    
    case 'gitee': {
      const config = await getHostConfig('gitee');
      if (!config || !config.repo || !config.accessToken) {
        throw new Error('请先配置 Gitee 图床参数');
      }
      const { username, repo } = parseRepoUrl(config.repo);
      const base64Content = await toBase64(file);
      return uploadToGitee(base64Content, file.name, {
        username,
        repo,
        branch: config.branch || 'master',
        accessToken: config.accessToken,
      });
    }
    
    case 'aliOSS': {
      const config = await getHostConfig('aliOSS');
      if (!config || !config.accessKeyId || !config.accessKeySecret || !config.bucket || !config.region) {
        throw new Error('请先配置阿里云 OSS 图床参数');
      }
      const base64Content = await toBase64(file);
      return uploadToAliOSS(base64Content, file.name, {
        region: config.region,
        bucket: config.bucket,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        cdnHost: config.cdnHost,
        path: config.path,
      });
    }
    
    case 'txCOS': {
      const config = await getHostConfig('txCOS');
      if (!config || !config.secretId || !config.secretKey || !config.bucket || !config.region) {
        throw new Error('请先配置腾讯云 COS 图床参数');
      }
      return uploadToTxCOS(file, {
        secretId: config.secretId,
        secretKey: config.secretKey,
        bucket: config.bucket,
        region: config.region,
        path: config.path,
        cdnHost: config.cdnHost,
      });
    }
    
    case 'qiniu': {
      const config = await getHostConfig('qiniu');
      if (!config || !config.accessKey || !config.secretKey || !config.bucket || !config.domain || !config.region) {
        throw new Error('请先配置七牛云图床参数');
      }
      return uploadToQiniu(file, {
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        bucket: config.bucket,
        domain: config.domain,
        region: config.region,
        path: config.path,
      });
    }
    
    case 'minio': {
      const config = await getHostConfig('minio');
      if (!config || !config.endpoint || !config.bucket || !config.accessKey || !config.secretKey) {
        throw new Error('请先配置 MinIO 图床参数');
      }
      const base64Content = await toBase64(file);
      return uploadToMinio(base64Content, file.name, {
        endpoint: config.endpoint,
        port: config.port,
        useSSL: config.useSSL !== false,
        bucket: config.bucket,
        accessKey: config.accessKey,
        secretKey: config.secretKey,
      });
    }
    
    case 'custom':
      throw new Error('自定义图床暂未实现');
    
    default:
      return uploadToWechat(file, onProgress);
  }
}

/**
 * 批量上传图片
 * @param files - 文件数组
 * @param host - 图床类型
 * @param onProgress - 进度回调
 */
export async function uploadImages(
  files: File[],
  host: ImageHost = 'wechat',
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadImage({
        file: files[i],
        host,
        onProgress: (progress) => {
          if (onProgress) {
            // 计算总体进度
            const overallProgress = Math.round(
              ((i * 100 + progress) / total)
            );
            onProgress(i + 1, total);
          }
        },
      });
      results.push(url);
    } catch (error) {
      console.error(`上传图片 ${files[i].name} 失败:`, error);
      throw error;
    }
  }

  return results;
}

