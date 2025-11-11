import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MonthlyData, MonthlyHistory } from "@shared/schema";
import { CalendarCheck, TrendingUp, PackageOpen, ShoppingBag, Shirt, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: monthlyData, isLoading } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly/current"],
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<MonthlyHistory[]>({
    queryKey: ["/api/monthly/history"],
  });

  const closeMonthMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/monthly/close", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly/history"] });
      toast({
        title: "Mês Fechado",
        description: "O mês foi fechado e os dados foram salvos no histórico",
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

  const calculateLucro = (receita: string, gastos: string) => {
    return Number(receita) - Number(gastos);
  };

  const calculateTotal = () => {
    if (!monthlyData) return 0;
    return monthlyData.reduce((total, data) => {
      return total + calculateLucro(data.receita, data.gastos);
    }, 0);
  };

  const calculateTotalReceitas = () => {
    if (!monthlyData) return 0;
    return monthlyData.reduce((total, data) => total + Number(data.receita), 0);
  };

  const calculateTotalGastos = () => {
    if (!monthlyData) return 0;
    return monthlyData.reduce((total, data) => total + Number(data.gastos), 0);
  };

  const getReceitasGastosData = () => {
    if (!monthlyData) return [];
    
    const categoryNames = {
      plr_nacional: 'PLR Nacional',
      plr_internacional: 'PLR Internacional',
      marca_roupas: 'Marca de Roupas',
    };

    const categoryData = monthlyData.map(data => ({
      categoria: categoryNames[data.category as keyof typeof categoryNames],
      Receitas: Number(data.receita),
      Gastos: Number(data.gastos),
    }));

    const totalReceitas = calculateTotalReceitas();
    const totalGastos = calculateTotalGastos();

    return [
      ...categoryData,
      {
        categoria: 'Total',
        Receitas: totalReceitas,
        Gastos: totalGastos,
      }
    ];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const totalLucro = calculateTotal();
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{currentMonth}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:gap-6">
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Lucro Total do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold text-primary" data-testid="lucro-total">
                  {formatCurrency(totalLucro)}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ganhos vs Gastos do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total de Receitas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="total-receitas">
                      {formatCurrency(calculateTotalReceitas())}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total de Gastos</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="total-gastos">
                      {formatCurrency(calculateTotalGastos())}
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getReceitasGastosData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="categoria" 
                        className="text-xs"
                        stroke="currentColor"
                      />
                      <YAxis 
                        className="text-xs"
                        stroke="currentColor"
                        tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar 
                        dataKey="Receitas" 
                        fill="#10b981" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="Gastos" 
                        fill="#ef4444" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {historyData && historyData.length > 0 && (
              <Card className="hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Evolução dos Lucros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={historyData.slice().reverse().map(h => {
                          const monthName = new Date(h.year, h.month - 1).toLocaleDateString('pt-BR', { 
                            month: 'short',
                            year: '2-digit'
                          });
                          const plrNacionalLucro = Number(h.plrNacionalReceita) - Number(h.plrNacionalGastos);
                          const plrInternacionalLucro = Number(h.plrInternacionalReceita) - Number(h.plrInternacionalGastos);
                          const marcaRoupasLucro = Number(h.marcaRoupasReceita) - Number(h.marcaRoupasGastos);
                          const totalLucro = plrNacionalLucro + plrInternacionalLucro + marcaRoupasLucro;
                          
                          return {
                            mes: monthName,
                            'PLR Nacional': plrNacionalLucro,
                            'PLR Internacional': plrInternacionalLucro,
                            'Marca de Roupas': marcaRoupasLucro,
                            'Total': totalLucro,
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="mes" 
                          className="text-xs"
                          stroke="currentColor"
                        />
                        <YAxis 
                          className="text-xs"
                          stroke="currentColor"
                          tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="PLR Nacional" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="PLR Internacional" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Marca de Roupas" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Total" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => closeMonthMutation.mutate()}
            disabled={closeMonthMutation.isPending}
            data-testid="button-close-month"
          >
            <CalendarCheck className="mr-2 h-5 w-5" />
            {closeMonthMutation.isPending ? "Fechando mês..." : "Fechar Mês"}
          </Button>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {historyLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            </div>
          ) : historyData && historyData.length > 0 ? (
            <div className="grid gap-4 md:gap-6">
              {historyData.map((history) => {
                const monthName = new Date(history.year, history.month - 1).toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                });
                
                const plrNacionalLucro = Number(history.plrNacionalReceita) - Number(history.plrNacionalGastos);
                const plrInternacionalLucro = Number(history.plrInternacionalReceita) - Number(history.plrInternacionalGastos);
                const marcaRoupasLucro = Number(history.marcaRoupasReceita) - Number(history.marcaRoupasGastos);
                const totalLucro = plrNacionalLucro + plrInternacionalLucro + marcaRoupasLucro;

                return (
                  <Card key={history.id} data-testid={`history-card-${history.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        <History className="h-5 w-5 text-primary" />
                        {monthName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <PackageOpen className="h-4 w-4 text-muted-foreground" />
                            PLR Nacional
                          </p>
                          <p className={`text-lg font-bold ${
                            plrNacionalLucro >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                          }`} data-testid={`history-lucro-plr-nacional-${history.id}`}>
                            {formatCurrency(plrNacionalLucro)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            PLR Internacional
                          </p>
                          <p className={`text-lg font-bold ${
                            plrInternacionalLucro >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                          }`} data-testid={`history-lucro-plr-internacional-${history.id}`}>
                            {formatCurrency(plrInternacionalLucro)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Shirt className="h-4 w-4 text-muted-foreground" />
                            Marca de Roupas
                          </p>
                          <p className={`text-lg font-bold ${
                            marcaRoupasLucro >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                          }`} data-testid={`history-lucro-marca-roupas-${history.id}`}>
                            {formatCurrency(marcaRoupasLucro)}
                          </p>
                        </div>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Lucro Total:</span>
                        <span className={`text-xl font-bold ${
                          totalLucro >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                        }`} data-testid={`history-lucro-total-${history.id}`}>
                          {formatCurrency(totalLucro)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum mês fechado ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use o botão "Fechar Mês" para salvar o histórico
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
