import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import CryptoJS from 'crypto-js';
import { WechatConfig, AccessTokenInfo, MediaInfo } from '../mcp-tool/types.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 存储管理器
 * 使用 SQLite 数据库存储配置、令牌和素材信息
 */
export class StorageManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private secretKey: string | undefined;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/wechat-mcp.db');
    this.secretKey = process.env.WECHAT_MCP_SECRET_KEY;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const dataDir = path.dirname(this.dbPath);
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      // 检查是否是数据库损坏错误
      const isCorruptError = (err: any): boolean => {
        if (!err) return false;
        return (
          err.message?.includes('corrupt') || 
          err.message?.includes('malformed') ||
          err.code === 'SQLITE_CORRUPT' ||
          err.errno === 11 ||
          (err.message && /SQLITE_CORRUPT/i.test(err.message))
        );
      };

      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          logger.error('Failed to open database:', err);
          // 如果是损坏错误，尝试修复
          if (isCorruptError(err)) {
            logger.warn('Database corrupted on open, attempting to repair...');
            this.repairDatabase()
              .then(() => {
                // 重新打开数据库
                this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (reopenErr) => {
                  if (reopenErr) {
                    logger.error('Failed to reopen database after repair:', reopenErr);
                    reject(new Error(`数据库损坏且修复失败。请尝试删除数据库文件 ${this.dbPath} 后重启服务。错误: ${reopenErr.message}`));
                    return;
                  }
                  // 继续初始化流程
                  this.configureDatabase()
                    .then(() => this.checkDatabaseIntegrity())
                    .then(() => this.createTables())
                    .then(() => {
                      logger.info('Database repaired and initialized');
                      resolve();
                    })
                    .catch((initError) => {
                      logger.error('Failed to initialize after repair:', initError);
                      reject(initError);
                    });
                });
              })
              .catch((repairError) => {
                logger.error('Failed to repair database:', repairError);
                reject(new Error(`数据库损坏且修复失败。请尝试删除数据库文件 ${this.dbPath} 后重启服务。错误: ${repairError instanceof Error ? repairError.message : String(repairError)}`));
              });
          } else {
            reject(err);
          }
          return;
        }

        // 配置数据库以提高稳定性和性能
        this.configureDatabase()
          .then(() => this.checkDatabaseIntegrity())
          .then(() => this.createTables())
          .then(() => {
            logger.info('Storage manager initialized');
            resolve();
          })
          .catch((error) => {
            // 如果数据库损坏，尝试修复
            if (isCorruptError(error)) {
              logger.warn('Database corrupted during initialization, attempting to repair...');
              this.repairDatabase()
                .then(() => {
                  // 重新打开数据库
                  if (this.db) {
                    this.db.close((closeErr) => {
                      if (closeErr) {
                        logger.warn('Error closing database:', closeErr);
                      }
                    });
                  }
                  this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (reopenErr) => {
                    if (reopenErr) {
                      logger.error('Failed to reopen database after repair:', reopenErr);
                      reject(new Error(`数据库损坏且修复失败。请尝试删除数据库文件 ${this.dbPath} 后重启服务。错误: ${reopenErr.message}`));
                      return;
                    }
                    // 继续初始化流程
                    this.configureDatabase()
                      .then(() => this.checkDatabaseIntegrity())
                      .then(() => this.createTables())
                      .then(() => {
                        logger.info('Database repaired and initialized');
                        resolve();
                      })
                      .catch((initError) => {
                        logger.error('Failed to initialize after repair:', initError);
                        reject(initError);
                      });
                  });
                })
                .catch((repairError) => {
                  logger.error('Failed to repair database:', repairError);
                  reject(new Error(`数据库损坏且修复失败。请尝试删除数据库文件 ${this.dbPath} 后重启服务。错误: ${repairError instanceof Error ? repairError.message : String(repairError)}`));
                });
            } else {
              reject(error);
            }
          });
      });
    });
  }

  /**
   * 配置数据库（启用 WAL 模式等）
   */
  private async configureDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    
    // 启用 WAL 模式（Write-Ahead Logging），提高并发性能和稳定性
    await run('PRAGMA journal_mode = WAL');
    
    // 设置同步模式为 NORMAL（平衡性能和安全性）
    await run('PRAGMA synchronous = NORMAL');
    
    // 设置 busy_timeout（避免数据库锁定）
    await run('PRAGMA busy_timeout = 5000');
    
    // 启用外键约束
    await run('PRAGMA foreign_keys = ON');
  }

  /**
   * 检查数据库完整性
   */
  private async checkDatabaseIntegrity(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const get = promisify(this.db.get.bind(this.db));
      const result = await get('PRAGMA integrity_check') as { integrity_check: string } | undefined;
      
      if (result && result.integrity_check !== 'ok') {
        // 如果完整性检查失败，检查是否是空数据库（空数据库可能返回 'ok' 或其他值）
        // 对于严重损坏，会抛出错误
        if (result.integrity_check.includes('corrupt') || result.integrity_check.includes('malformed')) {
          throw new Error(`Database integrity check failed: ${result.integrity_check}`);
        }
        // 对于其他情况（可能是空数据库），记录警告但继续
        logger.warn(`Database integrity check result: ${result.integrity_check}`);
      }
    } catch (error: any) {
      // 如果完整性检查本身失败（可能是数据库损坏），抛出错误
      if (error?.message?.includes('corrupt') || error?.message?.includes('malformed') || 
          error?.code === 'SQLITE_CORRUPT' || error?.errno === 11) {
        throw error;
      }
      // 其他错误也抛出
      throw error;
    }
  }

  /**
   * 修复数据库
   */
  private async repairDatabase(): Promise<void> {
    logger.info('Attempting to repair database...');
    
    try {
      // 关闭当前连接（如果存在）
      if (this.db) {
        await new Promise<void>((resolve) => {
          this.db!.close((err) => {
            if (err) {
              logger.warn('Error closing database:', err);
            }
            this.db = null;
            resolve();
          });
        });
      }

      // 备份损坏的数据库
      const backupPath = `${this.dbPath}.backup.${Date.now()}`;
      if (existsSync(this.dbPath)) {
        try {
          copyFileSync(this.dbPath, backupPath);
          logger.info(`Backed up corrupted database to: ${backupPath}`);
        } catch (backupError) {
          logger.warn('Failed to backup corrupted database:', backupError);
        }
      }

      // 尝试删除损坏的数据库文件（如果 VACUUM 无法修复）
      // 但先尝试 VACUUM 修复
      return new Promise((resolve, reject) => {
        // 先尝试打开数据库并执行 VACUUM
        const tempDb = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
          if (err) {
            logger.warn('Cannot open database for VACUUM, will try to recreate:', err);
            // 如果无法打开，删除损坏的文件，让系统重新创建
            try {
              if (existsSync(this.dbPath)) {
                unlinkSync(this.dbPath);
                logger.info('Removed corrupted database file, will be recreated');
              }
            } catch (unlinkError) {
              logger.error('Failed to remove corrupted database file:', unlinkError);
            }
            resolve();
            return;
          }

          // 尝试执行 VACUUM 来修复数据库
          const run = promisify(tempDb.run.bind(tempDb));
          run('VACUUM')
            .then(() => {
              logger.info('Database vacuum completed');
              tempDb.close((closeErr) => {
                if (closeErr) {
                  logger.warn('Error closing temp database:', closeErr);
                }
                resolve();
              });
            })
            .catch((vacuumError) => {
              logger.warn('VACUUM failed, will try to recreate database:', vacuumError);
              tempDb.close((closeErr) => {
                if (closeErr) {
                  logger.warn('Error closing temp database:', closeErr);
                }
                // 如果 VACUUM 失败，删除损坏的文件
                try {
                  if (existsSync(this.dbPath)) {
                    unlinkSync(this.dbPath);
                    logger.info('Removed corrupted database file after VACUUM failure, will be recreated');
                  }
                } catch (unlinkError) {
                  logger.error('Failed to remove corrupted database file:', unlinkError);
                }
                resolve();
              });
            });
        });
      });
    } catch (error) {
      logger.error('Database repair failed:', error);
      throw error;
    }
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    // 配置表
    await run(`
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY,
        app_id TEXT NOT NULL,
        app_secret TEXT NOT NULL,
        token TEXT,
        encoding_aes_key TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Access Token 表
    await run(`
      CREATE TABLE IF NOT EXISTS access_tokens (
        id INTEGER PRIMARY KEY,
        access_token TEXT NOT NULL,
        expires_in INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    // 临时素材表
    await run(`
      CREATE TABLE IF NOT EXISTS media (
        media_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        url TEXT
      )
    `);

    // 永久素材表
    await run(`
      CREATE TABLE IF NOT EXISTS permanent_media (
        media_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        created_at INTEGER NOT NULL,
        update_time INTEGER,
        url TEXT
      )
    `);

    // 草稿表
    await run(`
      CREATE TABLE IF NOT EXISTS drafts (
        media_id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        update_time INTEGER NOT NULL
      )
    `);

    // 发布记录表
    await run(`
      CREATE TABLE IF NOT EXISTS publishes (
        publish_id TEXT PRIMARY KEY,
        msg_data_id TEXT NOT NULL,
        idx INTEGER,
        article_url TEXT,
        content TEXT,
        publish_time INTEGER NOT NULL,
        publish_status INTEGER NOT NULL
      )
    `);

    // 图床配置表
    await run(`
      CREATE TABLE IF NOT EXISTS image_host_configs (
        host_type TEXT PRIMARY KEY,
        config_data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // 当前使用的图床类型
    await run(`
      CREATE TABLE IF NOT EXISTS image_host_settings (
        id INTEGER PRIMARY KEY,
        current_host TEXT NOT NULL DEFAULT 'wechat',
        updated_at INTEGER NOT NULL
      )
    `);
  }

  private encryptValue(value: string | null | undefined): string | null {
    if (!value) return null;
    if (!this.secretKey) return value;
    const cipher = CryptoJS.AES.encrypt(value, this.secretKey).toString();
    return `enc:${cipher}`;
  }

  private decryptValue(value: string | null | undefined): string | null {
    if (!value) return null;
    if (!this.secretKey) return value;
    if (!value.startsWith('enc:')) return value;
    const cipher = value.slice(4);
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, this.secretKey);
      const text = bytes.toString(CryptoJS.enc.Utf8);
      return text || null;
    } catch {
      return null;
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config: WechatConfig): Promise<void> {
    // 如果数据库未初始化，尝试初始化
    if (!this.db) {
      logger.warn('Database not initialized, attempting to initialize...');
      try {
        await this.initialize();
      } catch (initError) {
        logger.error('Failed to initialize database in saveConfig:', initError);
        throw new Error(`数据库未初始化且初始化失败: ${initError instanceof Error ? initError.message : String(initError)}`);
      }
    }

    if (!this.db) {
      throw new Error('Database not initialized after initialization attempt');
    }

    const run = promisify(this.db.run.bind(this.db));
    const now = Date.now();

    try {
      await run(
        `INSERT OR REPLACE INTO config (id, app_id, app_secret, token, encoding_aes_key, created_at, updated_at) 
         VALUES (1, ?, ?, ?, ?, ?, ?)`,
        [
          config.appId,
          this.encryptValue(config.appSecret),
          this.encryptValue(config.token || null),
          this.encryptValue(config.encodingAESKey || null),
          now,
          now,
        ]
      );
    } catch (error: any) {
      // 检查是否是数据库损坏错误
      const isCorruptError = 
        error?.message?.includes('corrupt') || 
        error?.message?.includes('malformed') ||
        error?.code === 'SQLITE_CORRUPT' ||
        error?.errno === 11 || // SQLITE_CORRUPT 错误代码
        (error?.message && /SQLITE_CORRUPT/i.test(error.message));
      
      if (isCorruptError) {
        logger.warn('Database corruption detected during saveConfig, attempting repair...');
        try {
          // 修复数据库
          await this.repairDatabase();
          
          // 重新打开数据库
          await new Promise<void>((resolve, reject) => {
            if (this.db) {
              this.db.close((closeErr) => {
                if (closeErr) {
                  logger.warn('Error closing database before repair:', closeErr);
                }
                this.db = null;
              });
            }
            
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
              if (err) {
                logger.error('Failed to reopen database after repair:', err);
                reject(new Error(`修复后无法重新打开数据库: ${err.message}`));
                return;
              }
              
              // 配置数据库
              this.configureDatabase()
                .then(() => this.createTables())
                .then(() => {
                  logger.info('Database repaired and reconfigured');
                  resolve();
                })
                .catch((configError) => {
                  logger.error('Failed to configure database after repair:', configError);
                  reject(configError);
                });
            });
          });
          
          // 重试保存
          if (!this.db) {
            throw new Error('Database not initialized after repair');
          }
          const retryRun = promisify(this.db.run.bind(this.db));
          await retryRun(
            `INSERT OR REPLACE INTO config (id, app_id, app_secret, token, encoding_aes_key, created_at, updated_at) 
             VALUES (1, ?, ?, ?, ?, ?, ?)`,
            [
              config.appId,
              this.encryptValue(config.appSecret),
              this.encryptValue(config.token || null),
              this.encryptValue(config.encodingAESKey || null),
              now,
              now,
            ]
          );
          logger.info('Config saved successfully after database repair');
        } catch (repairError: any) {
          logger.error('Failed to save config after repair attempt:', repairError);
          const errorMsg = error?.message || String(error);
          throw new Error(`数据库损坏且修复失败。错误: ${errorMsg}。请尝试重启服务，如果问题持续，可能需要删除数据库文件 ${this.dbPath} 后重新创建。`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * 获取配置
   */
  async getConfig(): Promise<WechatConfig | null> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT * FROM config WHERE id = 1') as {
      app_id: string;
      app_secret: string;
      token?: string;
      encoding_aes_key?: string;
    } | undefined;

    if (!row) return null;

    return {
      appId: row.app_id,
      appSecret: this.decryptValue(row.app_secret) || row.app_secret,
      token: this.decryptValue(row.token) || row.token,
      encodingAESKey: this.decryptValue(row.encoding_aes_key) || row.encoding_aes_key,
    };
  }

  /**
   * 清除配置
   */
  async clearConfig(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM config WHERE id = 1');
  }

  /**
   * 保存 Access Token
   */
  async saveAccessToken(tokenInfo: AccessTokenInfo): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM access_tokens');
    await run(
      'INSERT INTO access_tokens (access_token, expires_in, expires_at, created_at) VALUES (?, ?, ?, ?)',
      [this.encryptValue(tokenInfo.accessToken), tokenInfo.expiresIn, tokenInfo.expiresAt, Date.now()]
    );
  }

  /**
   * 获取 Access Token
   */
  async getAccessToken(): Promise<AccessTokenInfo | null> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT * FROM access_tokens ORDER BY created_at DESC LIMIT 1') as {
      access_token: string;
      expires_in: number;
      expires_at: number;
    } | undefined;

    if (!row) return null;

    return {
      accessToken: this.decryptValue(row.access_token) || row.access_token,
      expiresIn: row.expires_in,
      expiresAt: row.expires_at,
    };
  }

  /**
   * 清除 Access Token
   */
  async clearAccessToken(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM access_tokens');
  }

  /**
   * 保存素材信息
   */
  async saveMedia(media: MediaInfo): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT OR REPLACE INTO media (media_id, type, created_at, url) VALUES (?, ?, ?, ?)',
      [media.mediaId, media.type, media.createdAt, media.url || null]
    );
  }

  /**
   * 获取素材信息
   */
  async getMedia(mediaId: string): Promise<MediaInfo | null> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT * FROM media WHERE media_id = ?', [mediaId]) as {
      media_id: string;
      type: string;
      created_at: number;
      url?: string;
    } | undefined;

    if (!row) return null;

    return {
      mediaId: row.media_id,
      type: row.type as 'image' | 'voice' | 'video' | 'thumb',
      createdAt: row.created_at,
      url: row.url,
    };
  }

  /**
   * 列出素材
   */
  async listMedia(type?: string): Promise<MediaInfo[]> {
    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));
    const query = type 
      ? 'SELECT * FROM media WHERE type = ? ORDER BY created_at DESC'
      : 'SELECT * FROM media ORDER BY created_at DESC';
    const params = type ? [type] : [];
    
    const rows = await all(query, params) as Array<{
      media_id: string;
      type: string;
      created_at: number;
      url?: string;
    }>;

    return rows.map(row => ({
      mediaId: row.media_id,
      type: row.type as 'image' | 'voice' | 'video' | 'thumb',
      createdAt: row.created_at,
      url: row.url,
    }));
  }

  /**
   * 保存图床配置
   */
  async saveImageHostConfig(hostType: string, config: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const now = Date.now();
    const configData = JSON.stringify(config);

    await run(
      `INSERT OR REPLACE INTO image_host_configs (host_type, config_data, created_at, updated_at) 
       VALUES (?, ?, COALESCE((SELECT created_at FROM image_host_configs WHERE host_type = ?), ?), ?)`,
      [hostType, this.encryptValue(configData), hostType, now, now]
    );
  }

  /**
   * 获取图床配置
   */
  async getImageHostConfig(hostType: string): Promise<Record<string, any> | null> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT * FROM image_host_configs WHERE host_type = ?', [hostType]) as {
      config_data: string;
    } | undefined;

    if (!row) return null;

    try {
      const decrypted = this.decryptValue(row.config_data) || row.config_data;
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * 删除图床配置
   */
  async deleteImageHostConfig(hostType: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM image_host_configs WHERE host_type = ?', [hostType]);
  }

  /**
   * 列出所有图床配置
   */
  async listImageHostConfigs(): Promise<Array<{ hostType: string; config: Record<string, any> }>> {
    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));
    const rows = await all('SELECT * FROM image_host_configs') as Array<{
      host_type: string;
      config_data: string;
    }>;

    return rows.map(row => {
      try {
        const decrypted = this.decryptValue(row.config_data) || row.config_data;
        return {
          hostType: row.host_type,
          config: JSON.parse(decrypted),
        };
      } catch {
        return {
          hostType: row.host_type,
          config: {},
        };
      }
    });
  }

  /**
   * 设置当前使用的图床
   */
  async setCurrentImageHost(hostType: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const now = Date.now();

    await run(
      `INSERT OR REPLACE INTO image_host_settings (id, current_host, updated_at) 
       VALUES (1, ?, ?)`,
      [hostType, now]
    );
  }

  /**
   * 获取当前使用的图床
   */
  async getCurrentImageHost(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT * FROM image_host_settings WHERE id = 1') as {
      current_host: string;
    } | undefined;

    return row?.current_host || 'wechat';
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            logger.error('Failed to close database:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}