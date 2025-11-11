// Referencing blueprint:firebase_barebones_javascript
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import admin from "firebase-admin";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

if (!admin.apps.length) {
  const initOptions: admin.AppOptions = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  };

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    initOptions.credential = admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    );
  }

  admin.initializeApp(initOptions);
}

function sanitizeUser(user: SelectUser): Omit<SelectUser, "password"> {
  const { password, ...sanitized } = user;
  return sanitized;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  app.post("/api/firebase-login", async (req, res, next) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).send("ID token é obrigatório");
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;

      let user = await storage.getUserByUsername(uid);
      
      if (!user) {
        const [firstName, ...lastNameParts] = (name || email || "").split(" ");
        user = await storage.createUser({
          username: uid,
          password: "firebase-auth",
          email: email || null,
          firstName: firstName || null,
          lastName: lastNameParts.join(" ") || null,
          profileImageUrl: picture || null,
        });
      }

      (req.session as any).userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(200).json(sanitizeUser(user));
    } catch (error: any) {
      console.error("Firebase login error:", error);
      res.status(401).send("Token inválido");
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Erro ao fazer logout");
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.sendStatus(401);
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.sendStatus(401);
    }

    res.json(sanitizeUser(user));
  });
}
