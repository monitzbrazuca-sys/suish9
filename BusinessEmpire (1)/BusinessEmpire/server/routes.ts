// API routes for Ruser
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  updateMonthlyDataSchema,
  insertTransactionSchema,
} from "@shared/schema";

async function isAuthenticated(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.sendStatus(401);
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.sendStatus(401);
  }

  req.user = user;
  next();
}

export function registerRoutes(app: Express): Server {
  // Auth middleware
  setupAuth(app);

  // Get current month data
  app.get("/api/monthly/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = await storage.getCurrentMonthData(userId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      res.status(500).json({ message: "Failed to fetch monthly data" });
    }
  });

  // Update monthly data for a category
  app.post("/api/monthly/update", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = updateMonthlyDataSchema.parse(req.body);
      const data = await storage.updateMonthlyData(userId, validatedData);
      res.json(data);
    } catch (error: any) {
      console.error("Error updating monthly data:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update monthly data" });
      }
    }
  });

  // Close current month and save to history
  app.post("/api/monthly/close", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.closeMonth(userId);
      res.json({ message: "Month closed successfully" });
    } catch (error) {
      console.error("Error closing month:", error);
      res.status(500).json({ message: "Failed to close month" });
    }
  });

  // Get monthly history
  app.get("/api/monthly/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const history = await storage.getMonthlyHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching monthly history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { category } = req.query;
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
      const transactions = await storage.getTransactionsByCategory(userId, category as string);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(userId, validatedData);
      res.json(transaction);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.patch("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(userId, id, validatedData);
      res.json(transaction);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else if (error.message === "Transaction not found") {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await storage.deleteTransaction(userId, id);
      res.json({ message: "Transaction deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      if (error.message === "Transaction not found") {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res.status(500).json({ message: "Failed to delete transaction" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
