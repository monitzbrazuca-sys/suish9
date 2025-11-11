// Database schema for Ruser - Simplified Monthly Model
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly data for each category
export const monthlyData = pgTable("monthly_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(), // 'plr_nacional', 'plr_internacional', 'marca_roupas'
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  gastos: decimal("gastos", { precision: 10, scale: 2 }).notNull().default("0"),
  receita: decimal("receita", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Historical data from closed months
export const monthlyHistory = pgTable("monthly_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  plrNacionalGastos: decimal("plr_nacional_gastos", { precision: 10, scale: 2 }).notNull(),
  plrNacionalReceita: decimal("plr_nacional_receita", { precision: 10, scale: 2 }).notNull(),
  plrInternacionalGastos: decimal("plr_internacional_gastos", { precision: 10, scale: 2 }).notNull(),
  plrInternacionalReceita: decimal("plr_internacional_receita", { precision: 10, scale: 2 }).notNull(),
  marcaRoupasGastos: decimal("marca_roupas_gastos", { precision: 10, scale: 2 }).notNull(),
  marcaRoupasReceita: decimal("marca_roupas_receita", { precision: 10, scale: 2 }).notNull(),
  closedAt: timestamp("closed_at").notNull().defaultNow(),
});

// Transactions for tracking individual expenses and gains
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  monthlyData: many(monthlyData),
  monthlyHistory: many(monthlyHistory),
  transactions: many(transactions),
}));

export const monthlyDataRelations = relations(monthlyData, ({ one }) => ({
  user: one(users, {
    fields: [monthlyData.userId],
    references: [users.id],
  }),
}));

export const monthlyHistoryRelations = relations(monthlyHistory, ({ one }) => ({
  user: one(users, {
    fields: [monthlyHistory.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Zod schemas and types for authentication
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Monthly data schemas
export const updateMonthlyDataSchema = z.object({
  category: z.enum(['plr_nacional', 'plr_internacional', 'marca_roupas']),
  gastos: z.string().or(z.number()).transform(val => String(val)),
  receita: z.string().or(z.number()).transform(val => String(val)),
});

export type UpdateMonthlyData = z.infer<typeof updateMonthlyDataSchema>;
export type MonthlyData = typeof monthlyData.$inferSelect;
export type MonthlyHistory = typeof monthlyHistory.$inferSelect;

// Transaction schemas
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['expense', 'gain']),
  category: z.enum(['plr_nacional', 'plr_internacional', 'marca_roupas']),
  amount: z.string().or(z.number()).transform(val => String(val)),
  description: z.string().min(1, "Descrição é obrigatória"),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
