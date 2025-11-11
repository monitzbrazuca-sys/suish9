import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "@shared/schema";
import { insertTransactionSchema } from "@shared/schema";
import type { z } from "zod";

type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export default function MarcaRoupas() {
  const { toast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", "marca_roupas"],
    queryFn: async () => {
      const res = await fetch("/api/transactions?category=marca_roupas", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      category: "marca_roupas",
      type: "gain",
      description: "",
      amount: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", "marca_roupas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly/current"] });
      setIsDialogOpen(false);
      form.reset({
        category: "marca_roupas",
        type: "gain",
        description: "",
        amount: "0",
      });
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; transaction: Partial<InsertTransaction> }) => {
      const res = await apiRequest("PATCH", `/api/transactions/${data.id}`, data.transaction);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", "marca_roupas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly/current"] });
      setIsDialogOpen(false);
      setEditingTransaction(null);
      form.reset({
        category: "marca_roupas",
        type: "gain",
        description: "",
        amount: "0",
      });
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/transactions/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", "marca_roupas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly/current"] });
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    form.reset({
      category: "marca_roupas",
      type: transaction.type as "expense" | "gain",
      description: transaction.description,
      amount: transaction.amount,
    });
    setIsDialogOpen(true);
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    form.reset({
      category: "marca_roupas",
      type: "gain",
      description: "",
      amount: "0",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: InsertTransaction) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, transaction: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(Number(value));
  };

  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalGains = transactions?.filter(t => t.type === 'gain').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const profit = totalGains - totalExpenses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando transações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marca de Roupas</h1>
          <p className="text-muted-foreground">Gerencie seus gastos e ganhos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTransaction} data-testid="button-add-transaction">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "Editar Transação" : "Nova Transação"}</DialogTitle>
              <DialogDescription>
                {editingTransaction ? "Atualize as informações da transação" : "Adicione um novo gasto ou ganho"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gain">Ganho</SelectItem>
                          <SelectItem value="expense">Gasto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="total-gains">
                {formatCurrency(totalGains.toString())}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="total-expenses">
                {formatCurrency(totalExpenses.toString())}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={profit >= 0 ? "border-green-500/50" : "border-red-500/50"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`} data-testid="profit">
              {formatCurrency(profit.toString())}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>Lista de todos os seus gastos e ganhos</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.type === 'gain' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{transaction.type === 'gain' ? 'Ganho' : 'Gasto'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                      <TableCell className={`text-right font-medium ${transaction.type === 'gain' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(transaction.occurredAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                            data-testid={`button-edit-${transaction.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(transaction.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${transaction.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma transação cadastrada ainda</p>
              <Button onClick={handleNewTransaction} variant="outline" data-testid="button-add-first-transaction">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
