import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    try {
      // Validar formato de contraseña almacenada
      if (!storedPassword || !storedPassword.includes('.')) {
        return false;
      }

      const [hashedPassword, salt] = storedPassword.split(".");
      
      // Validar que los componentes existan
      if (!hashedPassword || !salt) {
        return false;
      }

      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = (await scryptAsync(
        suppliedPassword,
        salt,
        64
      )) as Buffer;

      // Verificar que los buffers tengan la misma longitud antes de comparar
      if (hashedPasswordBuf.length !== suppliedPasswordBuf.length) {
        return false;
      }

      return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);    } catch (error) {
      return false;
    }
  },
};

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      role: "user" | "admin" | "staff" | "selfservice" | "visualizer";
      branchId?: number | null;
      mustChangePassword?: boolean;
      isActive: boolean;
      createdAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const isProduction = app.get("env") === "production";

  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "appointment-system-secret",
    name: "appointment.sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
      ttl: 86400000,
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Usuario inactivo" });
        }        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Contraseña incorrecta" });
        }

        return done(null, {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
          createdAt: user.createdAt,
        });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });  passport.deserializeUser(async (id: number, done) => {
    try {      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return done(null, false);
      }

      done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      });
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/change-password", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "La nueva contraseña es requerida" });
      }

      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Si el usuario debe cambiar la contraseña, no validamos la contraseña actual
      if (!currentUser.mustChangePassword && currentPassword) {
        const isCurrentPasswordValid = await crypto.compare(currentPassword, currentUser.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        }
      }

      const hashedNewPassword = await crypto.hash(newPassword);

      const [updatedUser] = await db
        .update(users)
        .set({
          password: hashedNewPassword,
          mustChangePassword: false // Siempre actualizamos este campo al cambiar la contraseña
        })
        .where(eq(users.id, req.user.id))
        .returning();

      if (!updatedUser) {
        return res.status(500).json({ message: "Error al actualizar la contraseña" });
      }

      // Actualizamos la sesión del usuario
      req.user.mustChangePassword = false;

      return res.json({
        message: "Contraseña actualizada exitosamente",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          mustChangePassword: false,
          createdAt: updatedUser.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",      (err: any, user: Express.User | false, info: IVerifyOptions) => {
        if (err) {
          return res.status(500).json({
            message: "Error interno del servidor",
          });
        }

        if (!user) {
          return res.status(401).json({
            message: info.message || "Error de autenticación",
          });
        }

        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({
              message: "Error de inicio de sesión",
            });
          }

          return res.json({
            message: "Inicio de sesión exitoso",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              mustChangePassword: user.mustChangePassword,
            },
          });
        });
      }
    )(req, res, next);
  });
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = req.user;
  
    
    res.json({
      message: "Usuario autenticado",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      }
    });
  });

  app.post("/api/logout", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({ message: "No hay sesión activa" });
    }

    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error al destruir la sesión" });
        }
        res.clearCookie('appointment.sid');
        res.json({ message: "Sesión cerrada exitosamente" });
      });
    });
  });
}