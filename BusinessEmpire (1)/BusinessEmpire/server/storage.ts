// Storage layer - Using in-memory storage temporarily until database is properly configured
import {
  type User,
  type UpsertUser,
  type InsertUser,
  type MonthlyData,
  type MonthlyHistory,
  type UpdateMonthlyData,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  sessionStore: session.Store;

  // Monthly data operations
  getCurrentMonthData(userId: string): Promise<MonthlyData[]>;
  updateMonthlyData(userId: string, data: UpdateMonthlyData): Promise<MonthlyData>;
  closeMonth(userId: string): Promise<void>;
  getMonthlyHistory(userId: string, limit?: number): Promise<MonthlyHistory[]>;

  // Transaction operations
  getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]>;
  createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(userId: string, id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(userId: string, id: string): Promise<void>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private monthlyData: Map<string, MonthlyData> = new Map();
  private monthlyHistory: Map<string, MonthlyHistory> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = generateId();
    const user: User = {
      id,
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const userId = userData.id || generateId();
    const existing = this.users.get(userId);
    const user: User = {
      id: userId,
      username: userData.username!,
      password: userData.password!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getCurrentMonthData(userId: string): Promise<MonthlyData[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const existingData = Array.from(this.monthlyData.values()).filter(
      d => d.userId === userId && d.month === currentMonth && d.year === currentYear
    );

    if (existingData.length === 3) {
      return existingData.sort((a, b) => {
        const order = { plr_nacional: 0, plr_internacional: 1, marca_roupas: 2 };
        return order[a.category as keyof typeof order] - order[b.category as keyof typeof order];
      });
    }

    const categories = ['plr_nacional', 'plr_internacional', 'marca_roupas'];
    const data: MonthlyData[] = [];

    for (const category of categories) {
      const existing = existingData.find(d => d.category === category);
      if (existing) {
        data.push(existing);
      } else {
        const id = generateId();
        const newData: MonthlyData = {
          id,
          userId,
          category,
          month: currentMonth,
          year: currentYear,
          gastos: "0",
          receita: "0",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.monthlyData.set(id, newData);
        data.push(newData);
      }
    }

    return data;
  }

  async updateMonthlyData(userId: string, updateData: UpdateMonthlyData): Promise<MonthlyData> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const existing = Array.from(this.monthlyData.values()).find(
      d => d.userId === userId && 
           d.category === updateData.category && 
           d.month === currentMonth && 
           d.year === currentYear
    );

    if (existing) {
      const updated: MonthlyData = {
        ...existing,
        gastos: updateData.gastos,
        receita: updateData.receita,
        updatedAt: new Date(),
      };
      this.monthlyData.set(existing.id, updated);
      return updated;
    } else {
      const id = generateId();
      const newData: MonthlyData = {
        id,
        userId,
        category: updateData.category,
        month: currentMonth,
        year: currentYear,
        gastos: updateData.gastos,
        receita: updateData.receita,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.monthlyData.set(id, newData);
      return newData;
    }
  }

  async closeMonth(userId: string): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentData = await this.getCurrentMonthData(userId);
    
    const plrNacional = currentData.find(d => d.category === 'plr_nacional');
    const plrInternacional = currentData.find(d => d.category === 'plr_internacional');
    const marcaRoupas = currentData.find(d => d.category === 'marca_roupas');

    const historyId = generateId();
    const history: MonthlyHistory = {
      id: historyId,
      userId,
      month: currentMonth,
      year: currentYear,
      plrNacionalGastos: plrNacional?.gastos || "0",
      plrNacionalReceita: plrNacional?.receita || "0",
      plrInternacionalGastos: plrInternacional?.gastos || "0",
      plrInternacionalReceita: plrInternacional?.receita || "0",
      marcaRoupasGastos: marcaRoupas?.gastos || "0",
      marcaRoupasReceita: marcaRoupas?.receita || "0",
      closedAt: new Date(),
    };
    this.monthlyHistory.set(historyId, history);

    currentData.forEach(data => {
      this.monthlyData.delete(data.id);
    });
  }

  async getMonthlyHistory(userId: string, limit: number = 12): Promise<MonthlyHistory[]> {
    return Array.from(this.monthlyHistory.values())
      .filter(h => h.userId === userId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .slice(0, limit);
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return Array.from(this.transactions.values())
      .filter(t => {
        const tDate = new Date(t.occurredAt);
        return t.userId === userId && 
               t.category === category &&
               tDate.getMonth() + 1 === currentMonth &&
               tDate.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }

  async createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction> {
    const id = generateId();
    const newTransaction: Transaction = {
      id,
      userId,
      category: transaction.category,
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      occurredAt: transaction.occurredAt || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, newTransaction);

    await this.recalculateMonthlyData(userId, transaction.category);
    return newTransaction;
  }

  async updateTransaction(userId: string, id: string, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const existing = this.transactions.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Transaction not found");
    }
    const updated: Transaction = {
      ...existing,
      ...transaction,
      updatedAt: new Date(),
    };
    this.transactions.set(id, updated);

    await this.recalculateMonthlyData(userId, existing.category);
    return updated;
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    const existing = this.transactions.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Transaction not found");
    }
    this.transactions.delete(id);

    await this.recalculateMonthlyData(userId, existing.category);
  }

  private async recalculateMonthlyData(userId: string, category: string): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const categoryTransactions = Array.from(this.transactions.values()).filter(t => {
      const tDate = new Date(t.occurredAt);
      return t.userId === userId && 
             t.category === category &&
             tDate.getMonth() + 1 === currentMonth &&
             tDate.getFullYear() === currentYear;
    });

    const totalExpenses = categoryTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalGains = categoryTransactions
      .filter(t => t.type === 'gain')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    await this.updateMonthlyData(userId, {
      category: category as 'plr_nacional' | 'plr_internacional' | 'marca_roupas',
      gastos: totalExpenses.toFixed(2),
      receita: totalGains.toFixed(2),
    });
  }
}

export const storage = new MemStorage();
