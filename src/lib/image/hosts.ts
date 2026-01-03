import axios from 'axios';
import COS from 'cos-js-sdk-v5';
import * as qiniu from 'qiniu-js';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { utf16to8, base64encode, safe64 } from './tokenTools';

// 浏览器环境下的 Buffer polyfill
function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 获取 `年/月/日` 形式的目录
 */
function getDir(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * 根据文件名获取它以 `时间戳+uuid` 的形式
 */
function getDateFilename(filename: string): string {
  const currentTimestamp = new Date().getTime();
  const fileSuffix = filename.split('.')[1];
  return `${currentTimestamp}-${uuidv4()}.${fileSuffix}`;
}

/**
 * GitHub 图床上传
 */
export async function uploadToGitHub(
  content: string,
  filename: string,
  config: { username: string; repo: string; branch: string; accessToken: string }
): Promise<string> {
  const dir = getDir();
  const dateFilename = getDateFilename(filename);
  const url = `https://api.github.com/repos/${config.username}/${config.repo}/contents/${dir}/${dateFilename}`;

  const response = await axios.put(
    url,
    {
      content,
      branch: config.branch || 'master',
      message: `Upload by wechat-official-account-mcp`,
    },
    {
      headers: {
        Authorization: `token ${config.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  const githubResourceUrl = `raw.githubusercontent.com/${config.username}/${config.repo}/${config.branch || 'master'}/`;
  const cdnResourceUrl = `fastly.jsdelivr.net/gh/${config.username}/${config.repo}@${config.branch || 'master'}/`;
  
  return response.data.content.download_url.replace(githubResourceUrl, cdnResourceUrl);
}

/**
 * Gitee 图床上传
 */
export async function uploadToGitee(
  content: string,
  filename: string,
  config: { username: string; repo: string; branch: string; accessToken: string }
): Promise<string> {
  const dir = getDir();
  const dateFilename = getDateFilename(filename);
  const url = `https://gitee.com/api/v5/repos/${config.username}/${config.repo}/contents/${dir}/${dateFilename}`;

  const response = await axios.post(
    url,
    {
      content,
      branch: config.branch || 'master',
      access_token: config.accessToken,
      message: `Upload by wechat-official-account-mcp`,
    }
  );

  return encodeURI(response.data.content.download_url);
}

/**
 * 阿里云 OSS 图床上传（通过 API）
 */
export async function uploadToAliOSS(
  content: string,
  filename: string,
  config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    cdnHost?: string;
    path?: string;
  }
): Promise<string> {
  // 通过后端 API 上传
  const response = await axios.post('/api/image-host/upload/alioss', {
    content,
    filename,
    config,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || '上传失败');
  }

  return response.data.data.url;
}

/**
 * 腾讯云 COS 图床上传
 */
export async function uploadToTxCOS(
  file: File,
  config: {
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
    path?: string;
    cdnHost?: string;
  }
): Promise<string> {
  const dateFilename = getDateFilename(file.name);
  const cos = new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  });

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: config.path ? `${config.path}/${dateFilename}` : dateFilename,
        Body: file,
      },
      function (err, data) {
        if (err) {
          reject(err);
        } else if (config.cdnHost) {
          const path = config.path ? `${config.path}/${dateFilename}` : dateFilename;
          resolve(`${config.cdnHost}/${path}`);
        } else {
          resolve(`https://${data.Location}`);
        }
      }
    );
  });
}

/**
 * 七牛云图床上传
 */
function getQiniuToken(accessKey: string, secretKey: string, putPolicy: Record<string, any>): string {
  const policy = JSON.stringify(putPolicy);
  const encoded = base64encode(utf16to8(policy));
  const hash = CryptoJS.HmacSHA1(encoded, secretKey);
  const encodedSigned = hash.toString(CryptoJS.enc.Base64);
  return `${accessKey}:${safe64(encodedSigned)}:${encoded}`;
}

export async function uploadToQiniu(
  file: File,
  config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain: string;
    region: string;
    path?: string;
  }
): Promise<string> {
  const token = getQiniuToken(config.accessKey, config.secretKey, {
    scope: config.bucket,
    deadline: Math.trunc(new Date().getTime() / 1000) + 3600,
  });
  const dir = config.path ? `${config.path}/` : '';
  const dateFilename = dir + getDateFilename(file.name);
  
  const observable = qiniu.upload(file, dateFilename, token, {}, { region: config.region });
  
  return new Promise((resolve, reject) => {
    observable.subscribe({
      next: (result) => {
        console.log(result);
      },
      error: (err) => {
        reject(new Error(err.message));
      },
      complete: (result) => {
        resolve(`${config.domain}/${result.key}`);
      },
    });
  });
}

/**
 * MinIO 图床上传（通过 API）
 */
export async function uploadToMinio(
  content: string,
  filename: string,
  config: {
    endpoint: string;
    port?: number;
    useSSL: boolean;
    bucket: string;
    accessKey: string;
    secretKey: string;
  }
): Promise<string> {
  // 通过后端 API 上传
  const response = await axios.post('/api/image-host/upload/minio', {
    content,
    filename,
    config,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || '上传失败');
  }

  return response.data.data.url;
}

