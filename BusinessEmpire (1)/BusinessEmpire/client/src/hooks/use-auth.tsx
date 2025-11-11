// Referencing blueprint:firebase_barebones_javascript
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider } from "@/lib/firebase";
import { 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

type LoginCredentials = {
  email: string;
  password: string;
};

type SignupCredentials = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginWithGoogleMutation: UseMutationResult<void, Error, void>;
  loginWithEmailMutation: UseMutationResult<void, Error, LoginCredentials>;
  signupWithEmailMutation: UseMutationResult<void, Error, SignupCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isSubscribed) return;
      
      setFirebaseUser(user);
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await apiRequest("POST", "/api/firebase-login", { idToken });
          const userData = await res.json();
          queryClient.setQueryData(["/api/user"], userData);
        } catch (error) {
          console.error("Error syncing Firebase user with backend:", error);
        }
      } else {
        queryClient.setQueryData(["/api/user"], null);
      }
      setIsLoadingAuth(false);
    });

    getRedirectResult(auth)
      .then(async (result) => {
        if (!isSubscribed) return;
        
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          const res = await apiRequest("POST", "/api/firebase-login", { idToken });
          const userData = await res.json();
          queryClient.setQueryData(["/api/user"], userData);
          setFirebaseUser(result.user);
          toast({
            title: "Login realizado",
            description: `Bem-vindo, ${result.user.displayName || result.user.email}!`,
          });
        }
      })
      .catch((error) => {
        if (!isSubscribed) return;
        
        console.error("Redirect error:", error);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [toast]);

  const {
    data: user,
    error,
    isLoading: isLoadingUser,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    enabled: !isLoadingAuth && !!firebaseUser,
    retry: false,
  });

  const loginWithGoogleMutation = useMutation({
    mutationFn: async () => {
      await signInWithRedirect(auth, googleProvider);
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginWithEmailMutation = useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const res = await apiRequest("POST", "/api/firebase-login", { idToken });
      const userData = await res.json();
      queryClient.setQueryData(["/api/user"], userData);
    },
    onSuccess: () => {
      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("invalid-credential") || error.message.includes("wrong-password")
        ? "Email ou senha incorretos"
        : error.message.includes("user-not-found")
        ? "Usuário não encontrado"
        : error.message;
      toast({
        title: "Falha no login",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const signupWithEmailMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: SignupCredentials) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
      const idToken = await userCredential.user.getIdToken();
      const res = await apiRequest("POST", "/api/firebase-login", { idToken });
      const userData = await res.json();
      queryClient.setQueryData(["/api/user"], userData);
    },
    onSuccess: () => {
      toast({
        title: "Conta criada",
        description: "Sua conta foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("email-already-in-use")
        ? "Este email já está em uso"
        : error.message.includes("weak-password")
        ? "A senha deve ter pelo menos 6 caracteres"
        : error.message;
      toast({
        title: "Falha no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoadingAuth || isLoadingUser,
        error,
        loginWithGoogleMutation,
        loginWithEmailMutation,
        signupWithEmailMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
