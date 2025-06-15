import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';
import { ConfigService } from './ConfigService';

export interface UserFact {
  id: number;
  userId: string;
  guildId: string;
  factType: string;
  fact: string;
  confidence: number;
  timestamp: string;
}

export interface MemoryEntry {
  id: number;
  userId: string;
  channelId: string;
  guildId: string;
  userMessage: string;
  botResponse: string;
  timestamp: string;
  userName: string;
}

export class MemoryService {
  private configService: ConfigService;
  private db: Database | null = null;
  private dbPath: string;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.dbPath = path.join(__dirname, '../../data/memory.db');
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Create tables if they don't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_facts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          guildId TEXT NOT NULL,
          factType TEXT NOT NULL,
          fact TEXT NOT NULL,
          confidence REAL DEFAULT 1.0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS memory_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          channelId TEXT NOT NULL,
          guildId TEXT NOT NULL,
          userMessage TEXT NOT NULL,
          botResponse TEXT NOT NULL,
          userName TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_facts_user ON user_facts(userId, guildId);
        CREATE INDEX IF NOT EXISTS idx_memory_entries_user ON memory_entries(userId, channelId, guildId);
        CREATE INDEX IF NOT EXISTS idx_memory_entries_timestamp ON memory_entries(timestamp);
      `);

      console.log('✅ Memory database initialized');
    } catch (error) {
      console.error('❌ Error initializing memory database:', error);
    }
  }

  public async storeInteraction(
    userId: string,
    channelId: string,
    guildId: string,
    userMessage: string,
    botResponse: string,
    userName: string
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.run(`
        INSERT INTO memory_entries (userId, channelId, guildId, userMessage, botResponse, userName)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, channelId, guildId, userMessage, botResponse, userName]);

      // Clean up old entries if we exceed the limit
      const config = this.configService.getMemoryContextConfig();
      await this.db.run(`
        DELETE FROM memory_entries 
        WHERE userId = ? AND channelId = ? AND guildId = ? 
        AND id NOT IN (
          SELECT id FROM memory_entries 
          WHERE userId = ? AND channelId = ? AND guildId = ?
          ORDER BY timestamp DESC 
          LIMIT ?
        )
      `, [userId, channelId, guildId, userId, channelId, guildId, config.contextMessageCount]);
    } catch (error) {
      console.error('❌ Error storing interaction:', error);
    }
  }

  public async getConversationContext(
    userId: string,
    channelId: string,
    guildId: string
  ): Promise<string> {
    if (!this.db) return '';

    try {
      const config = this.configService.getMemoryContextConfig();
      
      const entries = await this.db.all(`
        SELECT userMessage, botResponse, userName, timestamp
        FROM memory_entries
        WHERE userId = ? AND channelId = ? AND guildId = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `, [userId, channelId, guildId, config.contextMessageCount]);

      if (entries.length === 0) return '';

      // Reverse to get chronological order
      entries.reverse();

      let context = 'Recent conversation:\n';
      for (const entry of entries) {
        context += `${entry.userName}: ${entry.userMessage}\n`;
        context += `Assistant: ${entry.botResponse}\n`;
      }

      // Add user facts if enabled
      if (config.includeFactsForMentionedUsers) {
        const facts = await this.getUserFacts(userId, guildId, config.maxUserFacts);
        if (facts.length > 0) {
          context += '\nKnown facts about this user:\n';
          facts.forEach(fact => {
            context += `- ${fact.fact}\n`;
          });
        }
      }

      return context;
    } catch (error) {
      console.error('❌ Error getting conversation context:', error);
      return '';
    }
  }

  public async storeUserFact(
    userId: string,
    guildId: string,
    factType: string,
    fact: string,
    confidence: number = 1.0
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.run(`
        INSERT INTO user_facts (userId, guildId, factType, fact, confidence)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, guildId, factType, fact, confidence]);

      // Clean up old facts if we exceed the limit
      const config = this.configService.getMemoryContextConfig();
      await this.db.run(`
        DELETE FROM user_facts 
        WHERE userId = ? AND guildId = ?
        AND id NOT IN (
          SELECT id FROM user_facts 
          WHERE userId = ? AND guildId = ?
          ORDER BY timestamp DESC 
          LIMIT ?
        )
      `, [userId, guildId, userId, guildId, config.maxUserFacts]);
    } catch (error) {
      console.error('❌ Error storing user fact:', error);
    }
  }

  public async getUserFacts(
    userId: string,
    guildId: string,
    limit: number = 10
  ): Promise<UserFact[]> {
    if (!this.db) return [];

    try {
      const facts = await this.db.all(`
        SELECT * FROM user_facts
        WHERE userId = ? AND guildId = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `, [userId, guildId, limit]);

      return facts;
    } catch (error) {
      console.error('❌ Error getting user facts:', error);
      return [];
    }
  }

  public async getAllUserFacts(guildId?: string): Promise<UserFact[]> {
    if (!this.db) return [];

    try {
      let query = 'SELECT * FROM user_facts';
      let params: any[] = [];

      if (guildId) {
        query += ' WHERE guildId = ?';
        params.push(guildId);
      }

      query += ' ORDER BY timestamp DESC';

      const facts = await this.db.all(query, params);
      return facts;
    } catch (error) {
      console.error('❌ Error getting all user facts:', error);
      return [];
    }
  }

  public async deleteUserFact(factId: number): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = await this.db.run('DELETE FROM user_facts WHERE id = ?', [factId]);
      return (result.changes || 0) > 0;
    } catch (error) {
      console.error('❌ Error deleting user fact:', error);
      return false;
    }
  }

  public async getAllMemoryEntries(guildId?: string): Promise<MemoryEntry[]> {
    if (!this.db) return [];

    try {
      let query = 'SELECT * FROM memory_entries';
      let params: any[] = [];

      if (guildId) {
        query += ' WHERE guildId = ?';
        params.push(guildId);
      }

      query += ' ORDER BY timestamp DESC';

      const entries = await this.db.all(query, params);
      return entries;
    } catch (error) {
      console.error('❌ Error getting all memory entries:', error);
      return [];
    }
  }

  public async deleteMemoryEntry(entryId: number): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = await this.db.run('DELETE FROM memory_entries WHERE id = ?', [entryId]);
      return (result.changes || 0) > 0;
    } catch (error) {
      console.error('❌ Error deleting memory entry:', error);
      return false;
    }
  }

  public async clearUserMemory(userId: string, guildId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.run('DELETE FROM user_facts WHERE userId = ? AND guildId = ?', [userId, guildId]);
      await this.db.run('DELETE FROM memory_entries WHERE userId = ? AND guildId = ?', [userId, guildId]);
      return true;
    } catch (error) {
      console.error('❌ Error clearing user memory:', error);
      return false;
    }
  }

  public async getMemoryStats(guildId?: string): Promise<any> {
    if (!this.db) return null;

    try {
      let factQuery = 'SELECT COUNT(*) as count FROM user_facts';
      let memoryQuery = 'SELECT COUNT(*) as count FROM memory_entries';
      let params: any[] = [];

      if (guildId) {
        factQuery += ' WHERE guildId = ?';
        memoryQuery += ' WHERE guildId = ?';
        params.push(guildId);
      }

      const factCount = await this.db.get(factQuery, params);
      const memoryCount = await this.db.get(memoryQuery, params);

      return {
        totalFacts: factCount?.count || 0,
        totalMemories: memoryCount?.count || 0,
        guildId: guildId || 'all'
      };
    } catch (error) {
      console.error('❌ Error getting memory stats:', error);
      return null;
    }
  }
}