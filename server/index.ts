import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { reminderScheduler } from "./services/reminder-scheduler";
import { noShowScheduler } from "./services/no-show-scheduler";
import path from "path";

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (app.get('env') === 'development') {
    res.status(status).json({ 
      message,
      stack: err.stack,
      details: err
    });
  } else {
    res.status(status).json({ message });
  }
});

(async () => {
  try {
    // Register all routes including auth
    const server = await registerRoutes(app);

    // Setup Vite in development
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Catch-all route for client-side routing
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
    });

    // ALWAYS serve the app on port 5000
    const PORT = 5000;

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
      log(`Database URL: ${process.env.DATABASE_URL ? 'configured' : 'missing'}`);
      log(`Environment: ${app.get('env')}`);
      
      // Inicializar el scheduler de recordatorios
      try {
        reminderScheduler.start();
        log(`🔔 Reminder scheduler initialized successfully`);
      } catch (schedulerError) {
        console.error('❌ Error initializing reminder scheduler:', schedulerError);
      }

      // Inicializar el scheduler de marcado "no asistió"
      try {
        noShowScheduler.start();
        log(`🚫 No-show scheduler initialized successfully`);
      } catch (noShowSchedulerError) {
        console.error('❌ Error initializing no-show scheduler:', noShowSchedulerError);
      }
    }).on('error', (error: any) => {
      console.error('Server startup error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();