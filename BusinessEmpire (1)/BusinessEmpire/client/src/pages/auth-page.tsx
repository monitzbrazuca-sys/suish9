// Referencing blueprint:firebase_barebones_javascript
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const signupSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginWithGoogleMutation, loginWithEmailMutation, signupWithEmailMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    if (loginWithGoogleMutation) {
      loginWithGoogleMutation.mutate();
    }
  };

  const handleEmailLogin = (data: LoginFormData) => {
    loginWithEmailMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleEmailSignup = (data: SignupFormData) => {
    signupWithEmailMutation.mutate({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  };

  if (isLoading || !loginWithGoogleMutation || !loginWithEmailMutation || !signupWithEmailMutation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Ruser</h1>
            <p className="text-muted-foreground">
              Gerencie seus negócios com eficiência
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Bem-vindo</CardTitle>
              <CardDescription className="text-center">
                Entre com sua conta ou crie uma nova
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleGoogleLogin}
                disabled={loginWithGoogleMutation?.isPending}
                data-testid="button-google-login"
              >
                <SiGoogle className="mr-2 h-5 w-5" />
                {loginWithGoogleMutation?.isPending ? "Redirecionando..." : "Continuar com Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou
                  </span>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup" data-testid="tab-signup">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        {...loginForm.register("email")}
                        data-testid="input-login-email"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginWithEmailMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginWithEmailMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={signupForm.handleSubmit(handleEmailSignup)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">Nome</Label>
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="João"
                          {...signupForm.register("firstName")}
                          data-testid="input-signup-firstname"
                        />
                        {signupForm.formState.errors.firstName && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname">Sobrenome</Label>
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder="Silva"
                          {...signupForm.register("lastName")}
                          data-testid="input-signup-lastname"
                        />
                        {signupForm.formState.errors.lastName && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        {...signupForm.register("email")}
                        data-testid="input-signup-email"
                      />
                      {signupForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        {...signupForm.register("password")}
                        data-testid="input-signup-password"
                      />
                      {signupForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        {...signupForm.register("confirmPassword")}
                        data-testid="input-signup-confirm-password"
                      />
                      {signupForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signupWithEmailMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signupWithEmailMutation.isPending ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center p-12 bg-muted">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              Controle total do seu negócio
            </h2>
            <p className="text-lg text-muted-foreground">
              Gerencie PLR Nacional, PLR Internacional e Marca de Roupas em um só lugar
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                📊 Dashboard Completo
              </h3>
              <p className="text-muted-foreground">
                Visualize o desempenho de cada categoria com gráficos e métricas em tempo real
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                💰 Gestão Financeira
              </h3>
              <p className="text-muted-foreground">
                Acompanhe gastos e receitas de forma organizada e eficiente
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                📈 Histórico Detalhado
              </h3>
              <p className="text-muted-foreground">
                Acesse dados históricos e tome decisões baseadas em informações concretas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
