import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { users, services, schedules, appointments, queues, servicePoints, servicePointServices, forms, formFields, selfServices, selfServiceServices, selfServiceServicePoints, branches, branchServices, surveys, surveyQuestions, surveyResponses, customBookingPages, insertCustomBookingPageSchema, selectCustomBookingPageSchema, appointmentReschedules, branchSettings, insertBranchSettingsSchema, selectBranchSettingsSchema, appointmentReminders } from "@db/schema";
import { emailService } from './services/email';
import { appointmentValidation } from './services/appointment-validation';
import { reminderService } from './services/reminder-service';
import BranchSettingsService from './services/branch-settings';
import { waitTimeAnalyticsService } from './services/wait-time-analytics';
import { BranchSettingsFormSchema, PartialBranchSettingsSchema, EmergencyModeToggleSchema } from './utils/branch-settings-validation';
import { eq, and, gte, desc, sql, ne, isNotNull, lte } from "drizzle-orm";
import { generateAppointmentQR, generateConfirmationCode, generateSurveyQR } from "./utils/qr-generator";
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);

  // Ruta para probar la conexión del servicio de correo (solo para admin)
  app.get("/api/test-email", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          message: "No autorizado - Solo admin puede probar el servicio de correo"
        });
      }

      const isConnected = await emailService.testConnection();
      
      if (isConnected) {
        res.json({
          status: "success",
          message: "Conexión SMTP exitosa"
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Error en la conexión SMTP"
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({
        status: "error",
        message: "Error al probar el servicio de correo"
      });
    }
  });

  // Ruta de registro
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Validación básica
      if (!username || !email || !password) {
        return res.status(400).json({
          message: "All fields are required"
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format"
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      // Verificar si el email ya está registrado
      const existingEmail = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail.length > 0) {
        return res.status(400).json({
          message: "Email already registered"
        });
      }

      // Hash de la contraseña
      const hashedPassword = await crypto.hash(password);

      // Crear nuevo usuario
      const [newUser] = await db.insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          role: "user",
          isActive: true,
          mustChangePassword: false
        })
        .returning();

      // Eliminar la contraseña del objeto de respuesta
      const { password: _, ...userWithoutPassword } = newUser;

      // Enviar correo de bienvenida
      try {
        await emailService.sendWelcomeEmail({
          username: newUser.username,
          email: newUser.email
        });
        console.log(`Welcome email sent to ${newUser.email}`);
      } catch (emailError) {
        // Log del error pero no fallar el registro
        console.error('Error sending welcome email:', emailError);
      }

      res.status(200).json({
        message: "Registration successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: "Error registering user"
      });
    }
  });  // Branches (Sedes)
  app.get("/api/branches", async (req, res, next) => {
    try {
      const allBranches = await db.select().from(branches);
      res.json(allBranches);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/branches", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const [branch] = await db
        .insert(branches)
        .values({
          name: req.body.name,
          description: req.body.description,
          address: req.body.address,
          phone: req.body.phone,
          email: req.body.email,
          isActive: true,
        })
        .returning();

      res.json(branch);
    } catch (error) {
      next(error);
    }  });
  // Ruta para activar/desactivar sede (toggle status) - DEBE IR ANTES que la ruta general
  app.put("/api/branches/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const branchId = parseInt(req.params.id);
      const { isActive } = req.body;

      // Validar que isActive sea un booleano
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "El estado debe ser verdadero o falso" });
      }

      const [updatedBranch] = await db
        .update(branches)
        .set({ isActive })
        .where(eq(branches.id, branchId))
        .returning();

      if (!updatedBranch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      res.json(updatedBranch);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/branches/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const branchId = parseInt(req.params.id);
      const [updatedBranch] = await db
        .update(branches)
        .set({
          name: req.body.name,
          description: req.body.description,
          address: req.body.address,
          phone: req.body.phone,
          email: req.body.email,
        })
        .where(eq(branches.id, branchId))
        .returning();

      if (!updatedBranch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      res.json(updatedBranch);
    } catch (error) {
      next(error);
    }
  });

  // === CONFIGURACIÓN DE MULTER PARA UPLOAD DE ARCHIVOS ===
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'logos');
  const backgroundsDir = path.join(__dirname, '..', 'uploads', 'backgrounds');

  // Crear directorios de uploads si no existen
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(backgroundsDir, { recursive: true });
  } catch (error) {
    console.log('Upload directories already exist or created successfully');
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `logo-${uniqueSuffix}${ext}`);
    }
  });

  const backgroundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, backgroundsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `background-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'));
      }
    }
  });

  const uploadBackground = multer({
    storage: backgroundStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB para imágenes de fondo
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'));
      }
    }
  });

  // === ENDPOINTS PARA PÁGINAS DE RESERVA PERSONALIZADAS ===

  /**
   * Obtiene la página de reserva personalizada de una sede
   * GET /api/branches/:id/custom-page
   */
  app.get("/api/branches/:id/custom-page", async (req, res, next) => {
    try {
      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Buscar página personalizada existente
      const [customPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (!customPage) {
        // Si no existe, retornar null para indicar que no hay configuración
        return res.json(null);
      }

      res.json(customPage);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Crea o actualiza la página de reserva personalizada de una sede
   * POST/PUT /api/branches/:id/custom-page
   */
  app.post("/api/branches/:id/custom-page", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede gestionar páginas personalizadas" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      const formData = req.body;

      // Separar datos para branches y customBookingPages
      const branchData = {
        pageSlug: formData.pageSlug,
        pageTitle: formData.pageTitle,
        pageDescription: formData.pageDescription,
        welcomeMessage: formData.welcomeMessage,
        headerColor: formData.headerColor,
        fontColor: formData.fontColor,
        accentColor: formData.accentColor,
        backgroundColor: formData.backgroundColor,
        showSocialMedia: formData.showSocialMedia,
        facebookUrl: formData.facebookUrl,
        instagramUrl: formData.instagramUrl,
        twitterUrl: formData.twitterUrl,
        enableWhatsApp: formData.enableWhatsApp,
        whatsappNumber: formData.whatsappNumber,
        customFooterText: formData.customFooterText,
        customPageEnabled: formData.customPageEnabled
      };

      const customPageData = {
        branchId,
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        heroBackgroundImage: formData.heroBackgroundImage || null, // Convertir string vacío a null
        requireTermsAcceptance: formData.requireTermsAcceptance,
        termsText: formData.termsText,
        privacyPolicyUrl: formData.privacyPolicyUrl,
        isActive: formData.customPageEnabled || false,
        lastModifiedBy: req.user.id
      };

      // Actualizar datos de la sede
      await db
        .update(branches)
        .set(branchData)
        .where(eq(branches.id, branchId));

      // Verificar si ya existe una página personalizada
      const [existingPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      // Si se está eliminando la imagen de fondo (viene como string vacío o null)
      if (formData.heroBackgroundImage === '' || formData.heroBackgroundImage === null) {
        // Buscar imagen actual para eliminarla
        if (existingPage?.heroBackgroundImage) {
          try {
            const imagePath = path.join(__dirname, '..', 'uploads', existingPage.heroBackgroundImage.replace('/uploads/', ''));
            if (fsSync.existsSync(imagePath)) {
              fsSync.unlinkSync(imagePath);
            }
          } catch (fileError) {
            console.warn('No se pudo eliminar el archivo físico:', fileError);
            // Continúa aunque no se pueda eliminar el archivo
          }
        }
        customPageData.heroBackgroundImage = null;
      }

      let customPage;

      if (existingPage) {
        // Actualizar página existente
        [customPage] = await db
          .update(customBookingPages)
          .set({
            ...customPageData,
            updatedAt: new Date()
          })
          .where(eq(customBookingPages.branchId, branchId))
          .returning();
      } else {
        // Crear nueva página
        [customPage] = await db
          .insert(customBookingPages)
          .values({
            ...customPageData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      }

      res.json(customPage);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Actualiza configuración específica de una página de reserva personalizada
   * PUT /api/branches/:id/custom-page
   */
  app.put("/api/branches/:id/custom-page", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede gestionar páginas personalizadas" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Verificar que existe la página personalizada
      const [existingPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (!existingPage) {
        return res.status(404).json({ message: "Página personalizada no encontrada" });
      }

      // Actualizar solo los campos proporcionados
      const updateData = {
        ...req.body,
        lastModifiedBy: req.user.id,
        updatedAt: new Date()
      };

      // Remover campos que no deben ser actualizados directamente
      delete updateData.id;
      delete updateData.branchId;
      delete updateData.createdAt;

      const [updatedPage] = await db
        .update(customBookingPages)
        .set(updateData)
        .where(eq(customBookingPages.branchId, branchId))
        .returning();

      res.json(updatedPage);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Elimina la página de reserva personalizada de una sede
   * DELETE /api/branches/:id/custom-page
   */
  app.delete("/api/branches/:id/custom-page", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede gestionar páginas personalizadas" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que existe la página personalizada
      const [existingPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (!existingPage) {
        return res.status(404).json({ message: "Página personalizada no encontrada" });
      }

      // Eliminar la página personalizada
      await db
        .delete(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId));

      res.json({ message: "Página personalizada eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Sube un logo para una sede
   * POST /api/branches/:id/upload-logo
   */
  app.post("/api/branches/:id/upload-logo", upload.single('logo'), async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede subir logos" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó ningún archivo" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Construir URL del logo
      const logoUrl = `/uploads/logos/${req.file.filename}`;

      // Actualizar la sede con la nueva URL del logo
      const [updatedBranch] = await db
        .update(branches)
        .set({ logoUrl })
        .where(eq(branches.id, branchId))
        .returning();

      // Si existe una página personalizada, también actualizar su configuración de tema
      const [customPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (customPage) {
        const currentThemeConfig = customPage.themeConfig || {};
        const updatedThemeConfig = {
          ...currentThemeConfig,
          logoUrl
        };

        await db
          .update(customBookingPages)
          .set({ 
            themeConfig: updatedThemeConfig,
            updatedAt: new Date()
          })
          .where(eq(customBookingPages.branchId, branchId));
      }

      res.json({ 
        message: "Logo subido correctamente",
        logoUrl,
        branch: updatedBranch
      });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "El archivo es demasiado grande. Máximo 5MB permitido." });
        }
      }
      next(error);
    }
  });

  /**
   * Elimina el logo de una sede
   * DELETE /api/branches/:id/remove-logo
   */
  app.delete("/api/branches/:id/remove-logo", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede eliminar logos" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Eliminar archivo físico si existe
      if (branch.logoUrl) {
        try {
          const logoPath = path.join(__dirname, '..', 'uploads', branch.logoUrl.replace('/uploads/', ''));
          if (fsSync.existsSync(logoPath)) {
            fsSync.unlinkSync(logoPath);
          }
        } catch (fileError) {
          console.warn('No se pudo eliminar el archivo físico del logo:', fileError);
        }
      }

      // Actualizar la sede removiendo el logo
      const [updatedBranch] = await db
        .update(branches)
        .set({ logoUrl: null })
        .where(eq(branches.id, branchId))
        .returning();

      // Si existe una página personalizada, también actualizar su configuración de tema
      const [customPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (customPage) {
        const currentThemeConfig = customPage.themeConfig || {};
        const updatedThemeConfig = {
          ...currentThemeConfig,
          logoUrl: null
        };

        await db
          .update(customBookingPages)
          .set({ 
            themeConfig: updatedThemeConfig,
            updatedAt: new Date()
          })
          .where(eq(customBookingPages.branchId, branchId));
      }

      res.json({ 
        message: "Logo eliminado correctamente",
        branch: updatedBranch
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Sube una imagen de fondo para una página personalizada
   * POST /api/branches/:id/upload-background
   */
  app.post("/api/branches/:id/upload-background", uploadBackground.single('background'), async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede subir imágenes de fondo" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó ningún archivo" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Construir URL de la imagen de fondo
      const backgroundImageUrl = `/uploads/backgrounds/${req.file.filename}`;

      // Buscar o crear página personalizada
      let [customPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (customPage) {
        // Actualizar página existente
        const [updatedPage] = await db
          .update(customBookingPages)
          .set({ 
            heroBackgroundImage: backgroundImageUrl,
            updatedAt: new Date()
          })
          .where(eq(customBookingPages.branchId, branchId))
          .returning();

        res.json({ 
          message: "Imagen de fondo subida correctamente",
          backgroundImageUrl,
          customPage: updatedPage
        });
      } else {
        // Crear nueva página personalizada con imagen de fondo
        const [newPage] = await db
          .insert(customBookingPages)
          .values({
            branchId,
            heroBackgroundImage: backgroundImageUrl,
            isActive: true
          })
          .returning();

        res.json({ 
          message: "Imagen de fondo subida correctamente y página personalizada creada",
          backgroundImageUrl,
          customPage: newPage
        });
      }

    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "El archivo es demasiado grande. Máximo 10MB permitido." });
        }
      }
      next(error);
    }
  });

  /**
   * Elimina la imagen de fondo de una página personalizada
   * DELETE /api/branches/:id/remove-background
   */
  app.delete("/api/branches/:id/remove-background", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede eliminar imágenes de fondo" });
      }

      const branchId = parseInt(req.params.id);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Buscar página personalizada
      let [customPage] = await db
        .select()
        .from(customBookingPages)
        .where(eq(customBookingPages.branchId, branchId))
        .limit(1);

      if (customPage && customPage.heroBackgroundImage) {
        // Intentar eliminar el archivo físico del servidor
        try {
          const imagePath = path.join(__dirname, '..', 'uploads', customPage.heroBackgroundImage.replace('/uploads/', ''));
          if (fsSync.existsSync(imagePath)) {
            fsSync.unlinkSync(imagePath);
          }
        } catch (fileError) {
          console.warn('No se pudo eliminar el archivo físico:', fileError);
          // Continúa aunque no se pueda eliminar el archivo
        }

        // Actualizar la base de datos para remover la imagen
        const [updatedPage] = await db
          .update(customBookingPages)
          .set({ 
            heroBackgroundImage: null,
            updatedAt: new Date()
          })
          .where(eq(customBookingPages.branchId, branchId))
          .returning();

        res.json({ 
          message: "Imagen de fondo eliminada correctamente",
          customPage: updatedPage
        });
      } else {
        res.json({ 
          message: "No hay imagen de fondo para eliminar",
        });
      }

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtiene la página de reserva pública por slug
   * GET /api/booking/:slug
   */
  app.get("/api/booking/:slug", async (req, res, next) => {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(400).json({ message: "Slug requerido" });
      }

      // Buscar la sede por slug en la configuración de la página personalizada
      const [customPage] = await db
        .select({
          customPage: customBookingPages,
          branch: branches
        })
        .from(customBookingPages)
        .innerJoin(branches, eq(customBookingPages.branchId, branches.id))
        .where(and(
          eq(branches.pageSlug, slug),
          eq(branches.customPageEnabled, true),
          eq(branches.isActive, true),
          eq(customBookingPages.isActive, true)
        ))
        .limit(1);

      if (!customPage) {
        return res.status(404).json({ message: "Página de reserva no encontrada" });
      }

      // Obtener servicios disponibles para esta sede
      const availableServices = await db
        .selectDistinct({
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          formId: services.formId
        })
        .from(services)
        .innerJoin(servicePointServices, eq(services.id, servicePointServices.serviceId))
        .innerJoin(servicePoints, eq(servicePointServices.servicePointId, servicePoints.id))
        .where(
          and(
            eq(servicePoints.branchId, customPage.branch.id),
            eq(servicePointServices.isActive, true),
            eq(servicePoints.isActive, true),
            eq(services.isActive, true)
          )
        );

      // Enriquecer servicios con información de formularios dinámicos
      const servicesWithForms = await Promise.all(
        availableServices.map(async (service) => {
          if (!service.formId) {
            return {
              ...service,
              form: null
            };
          }

          // Obtener información del formulario
          const [formData] = await db
            .select()
            .from(forms)
            .where(and(
              eq(forms.id, service.formId),
              eq(forms.isActive, true)
            ))
            .limit(1);

          if (!formData) {
            return {
              ...service,
              form: null
            };
          }

          // Obtener campos del formulario
          const fieldsData = await db
            .select()
            .from(formFields)
            .where(eq(formFields.formId, service.formId))
            .orderBy(formFields.order);

          return {
            ...service,
            form: {
              ...formData,
              fields: fieldsData
            }
          };
        })
      );

      // Obtener horarios disponibles para esta sede
      // Los horarios están asociados a servicios, así que obtenemos los horarios
      // de todos los servicios disponibles en esta sede
      const availableSchedules = await db
        .selectDistinct({
          id: schedules.id,
          serviceId: schedules.serviceId,
          dayOfWeek: schedules.dayOfWeek,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          isActive: schedules.isActive
        })
        .from(schedules)
        .innerJoin(services, eq(schedules.serviceId, services.id))
        .innerJoin(servicePointServices, eq(services.id, servicePointServices.serviceId))
        .innerJoin(servicePoints, eq(servicePointServices.servicePointId, servicePoints.id))
        .where(
          and(
            eq(servicePoints.branchId, customPage.branch.id),
            eq(schedules.isActive, true),
            eq(services.isActive, true),
            eq(servicePointServices.isActive, true),
            eq(servicePoints.isActive, true)
          )
        );

      // Construir respuesta completa para la página pública
      const publicPageData = {
        branch: customPage.branch,
        customPage: {
          ...customPage.customPage,
          // Mapear propiedades de la base de datos al formato esperado por el frontend
          requireTerms: customPage.customPage.requireTermsAcceptance,
          termsText: customPage.customPage.termsText,
          privacyPolicyUrl: customPage.customPage.privacyPolicyUrl
        },
        services: servicesWithForms,
        schedules: availableSchedules,
        metadata: {
          title: customPage.customPage.heroTitle || `Reservas - ${customPage.branch.name}`,
          description: customPage.customPage.heroSubtitle || customPage.branch.description,
          slug: customPage.branch.pageSlug
        }
      };

      res.json(publicPageData);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Procesa una nueva reserva desde la página personalizada y crea una cita
   * POST /api/booking/:slug/reserve
   */
  app.post("/api/booking/:slug/reserve", async (req, res, next) => {
    try {
      const { slug } = req.params;
      const { serviceId, date, time, customerData, dynamicFormData } = req.body;

      // Validar datos requeridos
      if (!slug || !serviceId || !date || !time || !customerData) {
        return res.status(400).json({ message: "Datos incompletos" });
      }

      if (!customerData.name || !customerData.email || !customerData.phone) {
        return res.status(400).json({ message: "Datos del cliente incompletos" });
      }

      // Buscar la sede y página personalizada
      const [customPage] = await db
        .select({
          customPage: customBookingPages,
          branch: branches
        })
        .from(customBookingPages)
        .innerJoin(branches, eq(customBookingPages.branchId, branches.id))
        .where(and(
          eq(branches.pageSlug, slug),
          eq(branches.customPageEnabled, true),
          eq(branches.isActive, true),
          eq(customBookingPages.isActive, true)
        ))
        .limit(1);

      if (!customPage) {
        return res.status(404).json({ message: "Página de reserva no encontrada" });
      }

      // Obtener información del servicio con formulario si existe
      const serviceWithForm = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          formId: services.formId,
          isActive: services.isActive,
          formData: {
            id: forms.id,
            name: forms.name,
            description: forms.description,
            isActive: forms.isActive
          }
        })
        .from(services)
        .leftJoin(forms, eq(services.formId, forms.id))
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!serviceWithForm.length) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      const service = serviceWithForm[0];

      // Si el servicio tiene formulario, validar que se hayan enviado los datos requeridos
      if (service.formId && service.formData?.id) {
        // Obtener campos del formulario para validación
        const formFieldsData = await db
          .select()
          .from(formFields)
          .where(eq(formFields.formId, service.formId))
          .orderBy(formFields.order);

        // Validar campos requeridos del formulario dinámico
        const missingFields = formFieldsData
          .filter(field => field.required)
          .filter(field => {
            const value = dynamicFormData?.[field.name];
            return !value || (typeof value === 'string' && !value.trim());
          });

        if (missingFields.length > 0) {
          return res.status(400).json({ 
            message: "Faltan campos requeridos del formulario",
            missingFields: missingFields.map(f => f.label)
          });
        }
      }

      // Crear fecha y hora de la cita
      const appointmentDateTime = new Date(`${date}T${time}`);
      
      // Generar código de confirmación único
      const { generateConfirmationCode } = await import('./utils/qr-generator.js');
      const confirmationCode = generateConfirmationCode();

      // Preparar datos del formulario dinámico para almacenar
      let formattedDynamicData = undefined;
      if (dynamicFormData && Object.keys(dynamicFormData).length > 0 && service.formData) {
        const formFieldsData = await db
          .select()
          .from(formFields)
          .where(eq(formFields.formId, service.formId!))
          .orderBy(formFields.order);

        formattedDynamicData = formFieldsData.map(field => ({
          label: field.label,
          value: dynamicFormData[field.name] || 'No especificado'
        }));
      }

      // Crear la cita en la base de datos
      const [appointment] = await db
        .insert(appointments)
        .values({
          userId: null, // Cita anónima
          serviceId: service.id,
          branchId: customPage.branch.id,
          confirmationCode,
          status: 'scheduled',
          type: 'public', // Nuevo tipo para citas públicas
          scheduledAt: appointmentDateTime,
          formData: formattedDynamicData ? JSON.stringify(formattedDynamicData) : null,
          // Datos del cliente anónimo
          guestName: customerData.name,
          guestEmail: customerData.email,
          guestPhone: customerData.phone,
          guestNotes: customerData.notes || null,
        })
        .returning();

      // Generar código QR para la cita
      const { generateAppointmentQR } = await import('./utils/qr-generator.js');
      const qrCode = await generateAppointmentQR(appointment);

      // Actualizar la cita con el código QR
      await db
        .update(appointments)
        .set({ qrCode })
        .where(eq(appointments.id, appointment.id));

      // Formatear fecha para el correo
      const formattedDate = appointmentDateTime.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Enviar correo de confirmación con código QR
      await emailService.sendBookingConfirmation({
        email: customerData.email,
        customerName: customerData.name,
        serviceName: service.name,
        appointmentDate: formattedDate,
        appointmentTime: time,
        branchName: customPage.branch.name,
        branchAddress: customPage.branch.address,
        branchPhone: customPage.branch.phone || undefined,
        notes: customerData.notes || undefined,
        duration: service.duration,
        dynamicFormData: formattedDynamicData,
        confirmationCode,
        qrCode // Incluir código QR en el email
      });

      res.json({ 
        success: true, 
        message: "Cita agendada exitosamente",
        appointment: {
          id: appointment.id,
          confirmationCode,
          scheduledAt: appointmentDateTime.toISOString(),
          serviceName: service.name,
          branchName: customPage.branch.name
        }
      });

    } catch (error) {
      console.error('Error processing booking request:', error);
      next(error);
    }
  });

  /**
   * Obtiene todas las sedes con sus páginas de reserva personalizadas (solo admin)
   * GET /api/custom-booking-pages
   */
  app.get("/api/custom-booking-pages", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo admin puede ver todas las páginas" });
      }

      const branchesWithPages = await db
        .select()
        .from(branches)
        .leftJoin(customBookingPages, eq(branches.id, customBookingPages.branchId))
        .where(eq(branches.isActive, true))
        .orderBy(branches.name);

      // Transformar la respuesta para que coincida con el tipo BranchWithCustomPage
      const formattedBranches = branchesWithPages.map(row => ({
        ...row.branches,
        customBookingPage: row.custom_booking_pages || null
      }));

      res.json(formattedBranches);
    } catch (error) {
      next(error);
    }
  });

  // === ENDPOINTS PARA SERVICIOS POR SEDE ===
  
  /**
   * Obtiene todos los servicios disponibles en una sede específica
   * GET /api/branches/:branchId/services
   */
  app.get("/api/branches/:branchId/services", async (req, res, next) => {
    try {
      const branchId = parseInt(req.params.branchId);
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }      // Obtener servicios disponibles en la sede a través de puntos de atención
      // Usamos DISTINCT para evitar duplicados cuando un servicio está en múltiples puntos de atención
      const availableServices = await db
        .selectDistinct({
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          formId: services.formId,
          isActive: services.isActive,
          createdAt: services.createdAt,
          branchId: branches.id,
          branchName: branches.name,
        })
        .from(services)
        .innerJoin(servicePointServices, eq(services.id, servicePointServices.serviceId))
        .innerJoin(servicePoints, eq(servicePointServices.servicePointId, servicePoints.id))
        .innerJoin(branches, eq(servicePoints.branchId, branches.id))
        .where(
          and(
            eq(branches.id, branchId),
            eq(servicePointServices.isActive, true),
            eq(servicePoints.isActive, true),
            eq(services.isActive, true)
          )
        )
        .orderBy(services.name);

      res.json(availableServices);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtiene todas las sedes que ofrecen un servicio específico
   * GET /api/services/:serviceId/branches
   */
  app.get("/api/services/:serviceId/branches", async (req, res, next) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "ID de servicio inválido" });
      }

      // Verificar que el servicio existe
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!service) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      // Obtener sedes que ofrecen el servicio
      const serviceBranches = await db
        .select({
          id: branches.id,
          name: branches.name,
          description: branches.description,
          address: branches.address,
          phone: branches.phone,
          email: branches.email,
          isActive: branches.isActive,
          createdAt: branches.createdAt,
        })
        .from(branches)
        .innerJoin(branchServices, eq(branches.id, branchServices.branchId))
        .where(
          and(
            eq(branchServices.serviceId, serviceId),
            eq(branchServices.isActive, true),
            eq(branches.isActive, true)
          )
        )
        .orderBy(branches.name);

      res.json(serviceBranches);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Verifica si un servicio está disponible en una sede específica
   * GET /api/services/:serviceId/branches/:branchId/availability
   */
  app.get("/api/services/:serviceId/branches/:branchId/availability", async (req, res, next) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const branchId = parseInt(req.params.branchId);
      
      if (isNaN(serviceId) || isNaN(branchId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }

      // Verificar disponibilidad del servicio en la sede
      const [availability] = await db
        .select({
          isAvailable: sql<boolean>`CASE WHEN ${branchServices.id} IS NOT NULL THEN true ELSE false END`,
        })
        .from(branchServices)
        .where(
          and(
            eq(branchServices.serviceId, serviceId),
            eq(branchServices.branchId, branchId),
            eq(branchServices.isActive, true)
          )
        )
        .limit(1);

      res.json({
        serviceId,
        branchId,
        isAvailable: availability?.isAvailable || false
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Gestiona la asignación de servicios a una sede
   * PUT /api/branches/:branchId/services
   */
  app.put("/api/branches/:branchId/services", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const branchId = parseInt(req.params.branchId);
      const { serviceIds } = req.body;
      
      if (isNaN(branchId)) {
        return res.status(400).json({ message: "ID de sede inválido" });
      }

      if (!Array.isArray(serviceIds)) {
        return res.status(400).json({ message: "Se requiere un array de IDs de servicios" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Eliminar asignaciones existentes
      await db
        .delete(branchServices)
        .where(eq(branchServices.branchId, branchId));

      // Insertar nuevas asignaciones
      if (serviceIds.length > 0) {
        await db.insert(branchServices).values(
          serviceIds.map((serviceId: number) => ({
            branchId,
            serviceId,
            isActive: true,
          }))
        );
      }

      // Obtener y retornar las asignaciones actualizadas
      const updatedServices = await db
        .select()
        .from(branchServices)
        .where(eq(branchServices.branchId, branchId));

      res.json(updatedServices);
    } catch (error) {
      next(error);
    }
  });

  // Ruta para obtener todos los puntos de atención de una sede específica
  app.get("/api/branches/:branchId/service-points", async (req, res, next) => {
    try {
      const branchId = parseInt(req.params.branchId);
      
      const baseQuery = db
        .select({
          id: servicePoints.id,
          name: servicePoints.name,
          description: servicePoints.description,
          branchId: servicePoints.branchId,
          isActive: servicePoints.isActive,
          createdAt: servicePoints.createdAt,
          branchName: branches.name,
        })
        .from(servicePoints)
        .leftJoin(branches, eq(servicePoints.branchId, branches.id));
      
      // Filtrar por branchId si se proporciona
      const allServicePoints = branchId 
        ? await baseQuery.where(eq(servicePoints.branchId, branchId))
        : await baseQuery;
      
      res.json(allServicePoints);
    } catch (error) {
      next(error);
    }
  });  // Obtener todos los puntos de atención del sistema
  app.get("/api/service-points/all", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      let allServicePoints;

      if (req.user.role === 'staff') {
        // Si es staff, solo ver puntos de atención de su sede
        if (!req.user.branchId) {
          return res.status(403).json({ message: "Staff user must be assigned to a branch" });
        }

        allServicePoints = await db
          .select({
            id: servicePoints.id,
            name: servicePoints.name,
            description: servicePoints.description,
            branchId: servicePoints.branchId,
            isActive: servicePoints.isActive,
            createdAt: servicePoints.createdAt,
            branchName: branches.name,
          })
          .from(servicePoints)
          .leftJoin(branches, eq(servicePoints.branchId, branches.id))
          .where(eq(servicePoints.branchId, req.user.branchId))
          .orderBy(servicePoints.name);
      } else {
        // Admin y otros roles ven todos los puntos de atención
        allServicePoints = await db
          .select({
            id: servicePoints.id,
            name: servicePoints.name,
            description: servicePoints.description,
            branchId: servicePoints.branchId,
            isActive: servicePoints.isActive,
            createdAt: servicePoints.createdAt,
            branchName: branches.name,
          })
          .from(servicePoints)
          .leftJoin(branches, eq(servicePoints.branchId, branches.id))
          .orderBy(servicePoints.name);
      }
      
      res.json(allServicePoints);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/service-points", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      let { branchId } = req.body;
      
      // Si no se proporciona branchId, asignar la primera sede activa
      if (!branchId) {
        const firstActiveBranch = await db
          .select()
          .from(branches)
          .where(eq(branches.isActive, true))
          .limit(1);
          
        if (firstActiveBranch.length > 0) {
          branchId = firstActiveBranch[0].id;
        } else {
          return res.status(400).json({ 
            message: "No hay sedes activas disponibles. Debe crear al menos una sede activa antes de crear puntos de atención." 
          });
        }
      }

      const [servicePoint] = await db
        .insert(servicePoints)
        .values({
          name: req.body.name,
          description: req.body.description,
          branchId: branchId,
          isActive: true,
        })
        .returning();

      res.json(servicePoint);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/service-points/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const servicePointId = parseInt(req.params.id);
      const [updatedServicePoint] = await db
        .update(servicePoints)
        .set({
          name: req.body.name,
          description: req.body.description,
          branchId: req.body.branchId,
        })
        .where(eq(servicePoints.id, servicePointId))
        .returning();

      if (!updatedServicePoint) {
        return res.status(404).json({ message: "Punto de atención no encontrado" });
      }

      res.json(updatedServicePoint);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/service-points/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const servicePointId = parseInt(req.params.id);
      const { isActive } = req.body;

      const [updatedServicePoint] = await db
        .update(servicePoints)
        .set({ isActive })
        .where(eq(servicePoints.id, servicePointId))
        .returning();

      if (!updatedServicePoint) {
        return res.status(404).json({ message: "Punto de atención no encontrado" });
      }

      res.json(updatedServicePoint);
    } catch (error) {
      next(error);
    }
  });  // Reasignar punto de atención a otra sede
  app.put("/api/service-points/:id/reassign", async (req, res, next) => {
    try {
      const servicePointId = parseInt(req.params.id);
      const { branchId } = req.body;

      // Verificar que la sede de destino existe
      const targetBranch = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!targetBranch.length) {
        return res.status(404).json({ message: "Sede de destino no encontrada" });
      }

      const [updatedServicePoint] = await db
        .update(servicePoints)
        .set({ branchId })
        .where(eq(servicePoints.id, servicePointId))
        .returning();

      if (!updatedServicePoint) {
        return res.status(404).json({ message: "Punto de atención no encontrado" });
      }

      res.json(updatedServicePoint);
    } catch (error) {
      next(error);
    }
  });  // Desasignar punto de atención (reasignar a otra sede activa disponible)
  app.put("/api/service-points/:id/unassign", async (req, res, next) => {
    try {
      const servicePointId = parseInt(req.params.id);
      const currentServicePoint = await db
        .select()
        .from(servicePoints)
        .where(eq(servicePoints.id, servicePointId))
        .limit(1);

      if (!currentServicePoint.length) {
        return res.status(404).json({ message: "Punto de atención no encontrado" });
      }

      // Obtener todas las sedes activas
      const availableBranches = await db
        .select()
        .from(branches)
        .where(eq(branches.isActive, true));

      // Filtrar la sede actual
      const otherBranches = availableBranches.filter(b => 
        b.id !== currentServicePoint[0].branchId
      );

      if (!otherBranches.length) {
        return res.status(400).json({ 
          message: "No hay otras sedes activas disponibles para reasignar el punto de atención" 
        });
      }

      // Asignar a la primera sede disponible
      const [updatedServicePoint] = await db
        .update(servicePoints)
        .set({ branchId: otherBranches[0].id })
        .where(eq(servicePoints.id, servicePointId))
        .returning();

      res.json(updatedServicePoint);
    } catch (error) {
      next(error);
    }
  });  // Service Point Services
  app.get("/api/service-point-services", async (req, res, next) => {
    try {
      const allServicePointServices = await db.select().from(servicePointServices);
      res.json(allServicePointServices);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/service-points/:id/services", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const servicePointId = parseInt(req.params.id);
      const { serviceIds } = req.body;

      // Primero eliminamos todas las asignaciones existentes
      await db
        .delete(servicePointServices)
        .where(eq(servicePointServices.servicePointId, servicePointId));

      // Luego insertamos las nuevas asignaciones
      if (serviceIds && serviceIds.length > 0) {
        await db.insert(servicePointServices).values(
          serviceIds.map((serviceId: number) => ({
            servicePointId,
            serviceId,
            isActive: true,
          }))
        );
      }

      const updatedServices = await db
        .select()
        .from(servicePointServices)
        .where(eq(servicePointServices.servicePointId, servicePointId));

      res.json(updatedServices);
    } catch (error) {
      next(error);
    }
  });  // Users Management
  app.get("/api/users", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { username, email, password, role, mustChangePassword, isActive, branchId } = req.body;

      // Verificar si el usuario ya existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create new user
      const [newUser] = await db
        .insert(users)        .values({
          username,
          email,
          password: hashedPassword,
          role,
          mustChangePassword,
          isActive,
          branchId,
        })
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }      const userId = parseInt(req.params.id);
      const { username, email, role, password, branchId } = req.body;

      const updateData: any = {
        username,
        email,
        role,
        branchId,
      };

      // Si se proporciona una nueva contraseña, hashearla
      if (password) {
        updateData.password = await crypto.hash(password);
        updateData.mustChangePassword = true;
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const userId = parseInt(req.params.id);
      const { isActive } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({ isActive })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });  // Services
  app.get("/api/services", async (req, res, next) => {
    try {
      const allServices = await db.select().from(services);
      res.json(allServices);
    } catch (error) {
      next(error);
    }
  });

  // Get single service with form data
  app.get("/api/services/:id", async (req, res, next) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      // Get service with form relation
      const serviceWithForm = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          formId: services.formId,
          isActive: services.isActive,
          createdAt: services.createdAt,
          formData: {
            id: forms.id,
            name: forms.name,
            description: forms.description,
            isActive: forms.isActive
          }
        })
        .from(services)
        .leftJoin(forms, eq(services.formId, forms.id))
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!serviceWithForm.length) {
        return res.status(404).json({ message: "Service not found" });
      }

      const service = serviceWithForm[0];

      // If service has a form, get its fields
      let formWithFields = null;
      if (service.formId && service.formData?.id) {
        const fields = await db
          .select()
          .from(formFields)
          .where(eq(formFields.formId, service.formId))
          .orderBy(formFields.order);

        formWithFields = {
          ...service.formData,
          fields: fields
        };
      }

      // Prepare response
      const response = {
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        formId: service.formId,
        isActive: service.isActive,
        createdAt: service.createdAt,
        form: formWithFields
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/services", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const [service] = await db.insert(services).values(req.body).returning();
      res.json(service);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/services/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }

      const serviceId = parseInt(req.params.id);
      const [updatedService] = await db
        .update(services)
        .set(req.body)
        .where(eq(services.id, serviceId))
        .returning();

      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(updatedService);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/services/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }

      const serviceId = parseInt(req.params.id);
      const { isActive } = req.body;

      const [updatedService] = await db
        .update(services)
        .set({ isActive })
        .where(eq(services.id, serviceId))
        .returning();

      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(updatedService);
    } catch (error) {
      next(error);
    }
  });

  // Get schedules for a service
  app.get("/api/services/:id/schedules", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      const serviceId = parseInt(req.params.id);

      const serviceSchedules = await db
        .select({
          id: schedules.id,
          dayOfWeek: schedules.dayOfWeek,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          isActive: schedules.isActive
        })
        .from(schedules)
        .where(
          and(
            eq(schedules.serviceId, serviceId),
            eq(schedules.isActive, true)
          )
        )
        .orderBy(schedules.dayOfWeek, schedules.startTime);

      res.json(serviceSchedules);
    } catch (error) {
      next(error);
    }
  });  // Schedules
  app.get("/api/schedules", async (req, res, next) => {
    try {
      const allSchedules = await db.select().from(schedules);
      res.json(allSchedules);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/schedules", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const [schedule] = await db.insert(schedules).values(req.body).returning();
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/schedules/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }

      const scheduleId = parseInt(req.params.id);
      const [updatedSchedule] = await db
        .update(schedules)
        .set(req.body)
        .where(eq(schedules.id, scheduleId))
        .returning();

      if (!updatedSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json(updatedSchedule);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/schedules/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }

      const scheduleId = parseInt(req.params.id);
      const { isActive } = req.body;

      const [updatedSchedule] = await db
        .update(schedules)
        .set({ isActive })
        .where(eq(schedules.id, scheduleId))
        .returning();

      if (!updatedSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json(updatedSchedule);
    } catch (error) {
      next(error);
    }
  });  // Appointments with email notifications
  app.get("/api/appointments", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      let query;
      
      if (req.user.role === "user") {
        // Los usuarios solo ven sus propias citas
        query = db
          .select({
            id: appointments.id,
            userId: appointments.userId,
            serviceId: appointments.serviceId,
            branchId: appointments.branchId,
            scheduledAt: appointments.scheduledAt,
            status: appointments.status,
            confirmationCode: appointments.confirmationCode,
            qrCode: appointments.qrCode,
            formData: appointments.formData,
            attendedAt: appointments.attendedAt,
            createdAt: appointments.createdAt,
            updatedAt: appointments.updatedAt,
            type: appointments.type,
            rescheduledById: appointments.rescheduledById,
            rescheduledAt: appointments.rescheduledAt,
            rescheduledReason: appointments.rescheduledReason,
            originalScheduledAt: appointments.originalScheduledAt,
            servicePointId: appointments.servicePointId,
            serviceName: services.name
          })
          .from(appointments)
          .innerJoin(services, eq(appointments.serviceId, services.id))
          .where(eq(appointments.userId, req.user.id))
          .orderBy(desc(appointments.createdAt));
      } else if (req.user.role === "staff") {
        // Los staff solo ven citas de su sede asignada
        if (!req.user.branchId) {
          return res.status(403).json({ message: "Staff user must be assigned to a branch" });
        }
        query = db
          .select({
            id: appointments.id,
            userId: appointments.userId,
            serviceId: appointments.serviceId,
            branchId: appointments.branchId,
            scheduledAt: appointments.scheduledAt,
            status: appointments.status,
            confirmationCode: appointments.confirmationCode,
            qrCode: appointments.qrCode,
            formData: appointments.formData,
            attendedAt: appointments.attendedAt,
            createdAt: appointments.createdAt,
            updatedAt: appointments.updatedAt,
            type: appointments.type,
            rescheduledById: appointments.rescheduledById,
            rescheduledAt: appointments.rescheduledAt,
            rescheduledReason: appointments.rescheduledReason,
            originalScheduledAt: appointments.originalScheduledAt,
            servicePointId: appointments.servicePointId,
            serviceName: services.name
          })
          .from(appointments)
          .innerJoin(services, eq(appointments.serviceId, services.id))
          .where(eq(appointments.branchId, req.user.branchId))
          .orderBy(desc(appointments.createdAt));
      } else if (req.user.role === "admin") {
        // Los admin ven todas las citas
        query = db
          .select({
            id: appointments.id,
            userId: appointments.userId,
            serviceId: appointments.serviceId,
            branchId: appointments.branchId,
            scheduledAt: appointments.scheduledAt,
            status: appointments.status,
            confirmationCode: appointments.confirmationCode,
            qrCode: appointments.qrCode,
            formData: appointments.formData,
            attendedAt: appointments.attendedAt,
            createdAt: appointments.createdAt,
            updatedAt: appointments.updatedAt,
            type: appointments.type,
            rescheduledById: appointments.rescheduledById,
            rescheduledAt: appointments.rescheduledAt,
            rescheduledReason: appointments.rescheduledReason,
            originalScheduledAt: appointments.originalScheduledAt,
            servicePointId: appointments.servicePointId,
            serviceName: services.name
          })
          .from(appointments)
          .innerJoin(services, eq(appointments.serviceId, services.id))
          .orderBy(desc(appointments.createdAt));
      } else {
        return res.status(403).json({ message: "Unauthorized role" });
      }

      const userAppointments = await query;
      res.json(userAppointments);
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/appointments", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }      
      
      // Validar que se proporcione branchId
      if (!req.body.branchId) {
        return res.status(400).json({ message: "Se requiere especificar la sede para la cita" });
      }      

      // Validar fecha programada
      const scheduledDate = new Date(req.body.scheduledAt);
      const validationResult = await appointmentValidation.validateBooking(
        scheduledDate, 
        req.body.branchId
      );

      if (!validationResult.isValid) {
        return res.status(400).json({ 
          message: validationResult.message,
          errorCode: validationResult.errorCode
        });
      }// Validar que el servicio esté disponible en la sede seleccionada a través de puntos de atención
      const [serviceAvailability] = await db
        .select()
        .from(servicePointServices)
        .innerJoin(servicePoints, eq(servicePointServices.servicePointId, servicePoints.id))
        .where(
          and(
            eq(servicePointServices.serviceId, req.body.serviceId),
            eq(servicePoints.branchId, req.body.branchId),
            eq(servicePointServices.isActive, true),
            eq(servicePoints.isActive, true)
          )
        )
        .limit(1);

      if (!serviceAvailability) {
        return res.status(400).json({ 
          message: "El servicio seleccionado no está disponible en la sede especificada" 
        });
      }

      // Generar código de confirmación único
      const confirmationCode = generateConfirmationCode();

      const appointment = {
        userId: req.user.id,
        serviceId: req.body.serviceId,
        branchId: req.body.branchId, // Sede seleccionada por el usuario
        scheduledAt: new Date(req.body.scheduledAt),
        confirmationCode,
        formData: req.body.formData ? JSON.stringify(req.body.formData) : null,
        type: 'appointment' as const
      };

      const [newAppointment] = await db.insert(appointments).values(appointment).returning();

      // Enviar correo de confirmación de la cita
      try {
        // Obtener información del usuario
        const [user] = await db
          .select({ email: users.email, username: users.username })
          .from(users)
          .where(eq(users.id, req.user.id))
          .limit(1);

        // Obtener información del servicio
        const [service] = await db
          .select({ name: services.name, duration: services.duration })
          .from(services)
          .where(eq(services.id, req.body.serviceId))
          .limit(1);

        // Obtener información de la sede
        const [branch] = await db
          .select({ name: branches.name, address: branches.address, phone: branches.phone })
          .from(branches)
          .where(eq(branches.id, req.body.branchId))
          .limit(1);

        // Enviar correo de confirmación si tenemos toda la información necesaria
        if (user?.email && service?.name && branch?.name) {
          const appointmentDate = new Date(req.body.scheduledAt);
          
          await emailService.sendAppointmentConfirmation({
            email: user.email,
            customerName: user.username,
            serviceName: service.name,
            appointmentDate: appointmentDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            appointmentTime: appointmentDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            confirmationCode: confirmationCode,
            branchName: branch.name,
            branchAddress: branch.address || undefined,
            branchPhone: branch.phone || undefined,
            duration: service.duration || 30
          });
        }
      } catch (emailError) {
        console.error('Error enviando email de confirmación:', emailError);
        // No fallar la creación de la cita por error de email
      }

      // Generar código QR para la cita
      try {
        const qrCode = await generateAppointmentQR(newAppointment);
        
        // Actualizar la cita con el código QR
        const [updatedAppointment] = await db
          .update(appointments)
          .set({ qrCode })
          .where(eq(appointments.id, newAppointment.id))
          .returning();

        // Programar recordatorio automático si está habilitado para la sede
        try {
          const reminderConfig = await appointmentValidation.getReminderConfig(req.body.branchId);
          if (reminderConfig.enableAutoReminders) {
            // Verificar que la cita sea elegible para recordatorio
            const eligibility = await appointmentValidation.isEligibleForReminder(
              new Date(req.body.scheduledAt),
              req.body.branchId,
              'scheduled'
            );

            if (eligibility.eligible) {
              // Programar recordatorio de forma asíncrona para no bloquear la respuesta
              reminderService.scheduleReminder(newAppointment.id).catch(reminderError => {
                console.error(`Error programando recordatorio para cita ${newAppointment.id}:`, reminderError);
              });
              console.log(`✅ Recordatorio programado para cita #${confirmationCode} (${reminderConfig.reminderHours}h antes)`);
            } else {
              console.log(`ℹ️ Cita #${confirmationCode} no elegible para recordatorio: ${eligibility.reason}`);
            }
          } else {
            console.log(`ℹ️ Recordatorios deshabilitados para la sede ${req.body.branchId}`);
          }
        } catch (reminderError) {
          console.error('Error en configuración de recordatorio:', reminderError);
          // No fallar la creación de la cita por error de recordatorio
        }

        res.json(updatedAppointment);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Si falla la generación del QR, aún devolvemos la cita sin QR
        res.json(newAppointment);
      }
    } catch (error) {
      next(error);
    }
  });

  // Appointment cancellation with email notification
  app.post("/api/appointments/:id/cancel", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      const appointmentId = parseInt(req.params.id);

      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      if (appointment.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "No autorizado para cancelar esta cita" });
      }

      // Verificar que la cita se pueda cancelar
      if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "La cita ya está cancelada" });
      }

      if (appointment.status === "completed") {
        return res.status(400).json({ message: "No se puede cancelar una cita completada" });
      }

      if (appointment.status === "no-show") {
        return res.status(400).json({ message: "No se puede cancelar una cita marcada como no asistió" });
      }

      // Validar si la cancelación es permitida según configuración de sede
      // Los administradores pueden cancelar cualquier cita sin restricciones (incluyendo citas pasadas)
      // Los usuarios regulares deben cumplir las políticas de cancelación de la sede
      const validationResult = await appointmentValidation.validateCancellation(
        new Date(appointment.scheduledAt), 
        appointment.branchId,
        req.user.role
      );

      if (!validationResult.isValid) {
        return res.status(400).json({ 
          message: validationResult.message,
          errorCode: validationResult.errorCode
        });
      }

      const [updatedAppointment] = await db
        .update(appointments)
        .set({ status: "cancelled" })
        .where(eq(appointments.id, appointmentId))
        .returning();

      // Enviar correo de notificación de cancelación
      try {
        let user = null;
        let customerEmail = null;
        let customerName = null;

        // Para citas públicas, usar datos del huésped
        if (appointment.type === 'public') {
          customerEmail = appointment.guestEmail;
          customerName = appointment.guestName;
        } else if (appointment.userId) {
          // Para citas regulares, obtener información del usuario
          const [userRecord] = await db
            .select({ email: users.email, username: users.username })
            .from(users)
            .where(eq(users.id, appointment.userId))
            .limit(1);
          
          if (userRecord) {
            user = userRecord;
            customerEmail = userRecord.email;
            customerName = userRecord.username;
          }
        }

        // Obtener información del servicio
        const [service] = await db
          .select({ name: services.name })
          .from(services)
          .where(eq(services.id, appointment.serviceId))
          .limit(1);

        // Obtener información de la sede
        const [branch] = await db
          .select({ name: branches.name, address: branches.address, phone: branches.phone })
          .from(branches)
          .where(eq(branches.id, appointment.branchId))
          .limit(1);

        // Enviar correo de cancelación si tenemos toda la información necesaria
        if (customerEmail && customerName && service?.name && branch?.name) {
          const appointmentDate = new Date(appointment.scheduledAt);
          
          await emailService.sendCancellationNotification({
            email: customerEmail,
            customerName: customerName,
            serviceName: service.name,
            appointmentDate: appointmentDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            appointmentTime: appointmentDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            confirmationCode: appointment.confirmationCode || '',
            reason: req.body.reason || undefined,
            branchName: branch.name,
            branchAddress: branch.address || undefined,
            branchPhone: branch.phone || undefined
          });
        }
      } catch (emailError) {
        console.error('Error enviando email de cancelación:', emailError);
        // No fallar la cancelación por error de email
      }

      // Cancelar recordatorios pendientes para esta cita
      try {
        await reminderService.cancelReminders(appointmentId);
        console.log(`✅ Recordatorios cancelados para cita #${appointment.confirmationCode}`);
      } catch (reminderError) {
        console.error('Error cancelando recordatorios:', reminderError);
        // No fallar la cancelación por error de recordatorio
      }

      res.json(updatedAppointment);
    } catch (error) {
      next(error);
    }
  });

  // Reschedule appointment endpoint
  app.post("/api/appointments/:id/reschedule", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      const appointmentId = parseInt(req.params.id);
      const { newScheduledAt, reason } = req.body;

      if (!newScheduledAt) {
        return res.status(400).json({ message: "Nueva fecha y hora requerida" });
      }

      const newScheduledDate = new Date(newScheduledAt);
      if (newScheduledDate <= new Date()) {
        return res.status(400).json({ message: "La nueva fecha debe ser futura" });
      }

      // Obtener la cita actual
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verificar permisos
      const canReschedule = 
        appointment.userId === req.user.id || // El usuario propietario
        req.user.role === "admin" || // Admin
        (req.user.role === "staff" && req.user.branchId === appointment.branchId); // Staff de la misma sede

      if (!canReschedule) {
        return res.status(403).json({ message: "No autorizado para reprogramar esta cita" });
      }

      // Verificar que la cita se pueda reprogramar
      if (appointment.status === "completed") {
        return res.status(400).json({ message: "No se puede reprogramar una cita completada" });
      }

      if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "No se puede reprogramar una cita cancelada" });
      }

      if (appointment.status === "no-show") {
        return res.status(400).json({ message: "No se puede reprogramar una cita marcada como no asistió" });
      }

      // Contar reprogramaciones existentes para esta cita
      const rescheduleHistory = await db
        .select()
        .from(appointmentReschedules)
        .where(eq(appointmentReschedules.appointmentId, appointmentId));

      // Validar si la reprogramación es permitida según configuración de sede
      // Los administradores pueden reagendar cualquier cita sin restricciones (incluyendo citas pasadas)
      // Los usuarios regulares deben cumplir las políticas de reprogramación de la sede
      const validationResult = await appointmentValidation.validateReschedule(
        new Date(appointment.scheduledAt),
        newScheduledDate,
        appointment.branchId,
        rescheduleHistory.length,
        req.user.role
      );

      if (!validationResult.isValid) {
        return res.status(400).json({ 
          message: validationResult.message,
          errorCode: validationResult.errorCode
        });
      }

      // Verificar disponibilidad del horario
      const existingAppointment = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.serviceId, appointment.serviceId),
            eq(appointments.branchId, appointment.branchId),
            eq(appointments.scheduledAt, newScheduledDate),
            ne(appointments.status, "cancelled"),
            ne(appointments.id, appointmentId)
          )
        )
        .limit(1);

      if (existingAppointment.length > 0) {
        return res.status(409).json({ message: "El horario seleccionado no está disponible" });
      }

      // Verificar horarios de servicio
      const dayOfWeek = newScheduledDate.getDay();
      const timeString = newScheduledDate.toTimeString().substring(0, 5);

      const schedule = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.serviceId, appointment.serviceId),
            eq(schedules.dayOfWeek, dayOfWeek),
            eq(schedules.isActive, true),
            lte(schedules.startTime, timeString),
            gte(schedules.endTime, timeString)
          )
        )
        .limit(1);

      if (schedule.length === 0) {
        return res.status(400).json({ message: "El horario seleccionado no está disponible para este servicio" });
      }

      // Guardar datos originales para el historial
      const originalScheduledAt = appointment.originalScheduledAt || appointment.scheduledAt;

      // Actualizar la cita
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          scheduledAt: newScheduledDate,
          rescheduledById: req.user.id,
          rescheduledAt: new Date(),
          rescheduledReason: reason || null,
          originalScheduledAt: originalScheduledAt,
          updatedAt: new Date()
        })
        .where(eq(appointments.id, appointmentId))
        .returning();

      // Registrar en el historial de reprogramaciones
      await db.insert(appointmentReschedules).values({
        appointmentId: appointmentId,
        originalScheduledAt: appointment.scheduledAt,
        newScheduledAt: newScheduledDate,
        rescheduledById: req.user.id,
        reason: reason || null
      });

      // Enviar notificación por correo al usuario (opcional)
      try {
        let customerEmail = null;
        let customerName = null;

        // Para citas públicas, usar datos del huésped
        if (appointment.type === 'public') {
          customerEmail = appointment.guestEmail;
          customerName = appointment.guestName;
        } else if (appointment.userId) {
          // Para citas regulares, obtener información del usuario
          const [user] = await db
            .select({ email: users.email, username: users.username })
            .from(users)
            .where(eq(users.id, appointment.userId))
            .limit(1);
          
          if (user) {
            customerEmail = user.email;
            customerName = user.username;
          }
        }

        const [service] = await db
          .select({ name: services.name })
          .from(services)
          .where(eq(services.id, appointment.serviceId))
          .limit(1);

        const [branch] = await db
          .select({ name: branches.name, address: branches.address, phone: branches.phone })
          .from(branches)
          .where(eq(branches.id, appointment.branchId))
          .limit(1);

        if (customerEmail && customerName && service?.name && branch?.name) {
          await emailService.sendRescheduleNotification({
            email: customerEmail,
            customerName: customerName,
            serviceName: service.name,
            newAppointmentDate: newScheduledDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            newAppointmentTime: newScheduledDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            originalAppointmentDate: appointment.scheduledAt.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            originalAppointmentTime: appointment.scheduledAt.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            confirmationCode: appointment.confirmationCode || '',
            reason: reason || undefined,
            branchName: branch.name,
            branchAddress: branch.address || undefined,
            branchPhone: branch.phone || undefined
          });
        }
      } catch (emailError) {
        console.error('Error enviando email de reprogramación:', emailError);
        // No fallar la reprogramación por error de email
      }

      // Gestionar recordatorios para la nueva fecha
      try {
        // Cancelar recordatorios existentes de la fecha anterior
        await reminderService.cancelReminders(appointmentId);
        console.log(`✅ Recordatorios anteriores cancelados para cita #${appointment.confirmationCode}`);

        // Programar nuevo recordatorio para la nueva fecha si está habilitado
        const reminderConfig = await appointmentValidation.getReminderConfig(appointment.branchId);
        if (reminderConfig.enableAutoReminders) {
          // Verificar que la nueva cita sea elegible para recordatorio
          const eligibility = await appointmentValidation.isEligibleForReminder(
            newScheduledDate,
            appointment.branchId,
            'scheduled'
          );

          if (eligibility.eligible) {
            // Programar nuevo recordatorio de forma asíncrona
            reminderService.scheduleReminder(appointmentId).catch(reminderError => {
              console.error(`Error programando nuevo recordatorio para cita ${appointmentId}:`, reminderError);
            });
            console.log(`✅ Nuevo recordatorio programado para cita #${appointment.confirmationCode} (${reminderConfig.reminderHours}h antes)`);
          } else {
            console.log(`ℹ️ Nueva fecha de cita #${appointment.confirmationCode} no elegible para recordatorio: ${eligibility.reason}`);
          }
        }
      } catch (reminderError) {
        console.error('Error gestionando recordatorios en reprogramación:', reminderError);
        // No fallar la reprogramación por error de recordatorio
      }

      res.json({
        ...updatedAppointment,
        message: "Cita reprogramada exitosamente"
      });
    } catch (error) {
      next(error);
    }
  });

  // Get reschedule history for an appointment
  app.get("/api/appointments/:id/reschedule-history", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      const appointmentId = parseInt(req.params.id);

      // Verificar que la cita existe y el usuario tiene permisos
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const canView = 
        appointment.userId === req.user.id || // El usuario propietario
        req.user.role === "admin" || // Admin
        (req.user.role === "staff" && req.user.branchId === appointment.branchId); // Staff de la misma sede

      if (!canView) {
        return res.status(403).json({ message: "No autorizado para ver el historial de esta cita" });
      }

      // Obtener historial de reprogramaciones
      const rescheduleHistory = await db
        .select({
          id: appointmentReschedules.id,
          originalScheduledAt: appointmentReschedules.originalScheduledAt,
          newScheduledAt: appointmentReschedules.newScheduledAt,
          reason: appointmentReschedules.reason,
          createdAt: appointmentReschedules.createdAt,
          rescheduledBy: {
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role
          }
        })
        .from(appointmentReschedules)
        .leftJoin(users, eq(appointmentReschedules.rescheduledById, users.id))
        .where(eq(appointmentReschedules.appointmentId, appointmentId))
        .orderBy(desc(appointmentReschedules.createdAt));

      res.json(rescheduleHistory);
    } catch (error) {
      next(error);
    }
  });
  // Check-in appointment endpoint
  app.post("/api/appointments/checkin", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      // Solo admin y staff pueden hacer check-in
      if (req.user.role !== "admin" && req.user.role !== "staff") {
        return res.status(403).json({ message: "No autorizado para realizar check-in" });
      }

      const { qrCode, confirmationCode } = req.body;

      if (!qrCode && !confirmationCode) {
        return res.status(400).json({ message: "Se requiere código QR o código de confirmación" });
      }



      let appointment;

      try {
        if (qrCode) {
          // Buscar por código QR
          const [foundAppointment] = await db
            .select()
            .from(appointments)
            .where(eq(appointments.qrCode, qrCode))
            .limit(1);
          appointment = foundAppointment;

        } else if (confirmationCode) {
          // Buscar por código de confirmación
          const [foundAppointment] = await db
            .select()
            .from(appointments)
            .where(eq(appointments.confirmationCode, confirmationCode))
            .limit(1);
          appointment = foundAppointment;

        }
      } catch (dbError) {
        console.error('Database search error:', dbError);
        return res.status(500).json({ message: "Error al buscar la cita en la base de datos" });
      }      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Validar que staff solo pueda hacer check-in de citas de su sede
      if (req.user.role === 'staff') {
        if (!req.user.branchId) {
          return res.status(403).json({ message: "Staff user must be assigned to a branch" });
        }
        if (appointment.branchId !== req.user.branchId) {
          return res.status(403).json({ message: "No autorizado para hacer check-in de citas de otras sedes" });
        }
      }

      if (appointment.status === "checked-in") {
        return res.status(400).json({ message: "Esta cita ya ha sido registrada con check-in" });
      }

      if (appointment.status === "completed") {
        return res.status(400).json({ message: "Esta cita ya ha sido completada" });
      }

      if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "Esta cita está cancelada" });
      }

      if (appointment.status === "no-show") {
        return res.status(400).json({ message: "Esta cita está marcada como no asistió" });
      }

      // Actualizar la cita con check-in (cambiar estado a "checked-in")
      const [updatedAppointment] = await db
        .update(appointments)
        .set({ 
          status: "checked-in",
          attendedAt: new Date()
        })
        .where(eq(appointments.id, appointment.id))
        .returning();

      // Obtener información adicional del usuario y servicio
      let userInfo = null;
      if (appointment.userId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, appointment.userId))
          .limit(1);
        userInfo = user;
      }

      const [serviceInfo] = await db
        .select()
        .from(services)
        .where(eq(services.id, appointment.serviceId))
        .limit(1);

      const responseData = {
        ...updatedAppointment,
        user: userInfo,
        service: serviceInfo
      };


      
      res.json(responseData);
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ message: "Error interno del servidor durante el check-in" });
    }  });

  // Endpoint para obtener citas con check-in que no están en cola
  app.get("/api/appointments/checked-in", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "No autorizado" });
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Construir condiciones de filtrado
      let whereConditions = [
        eq(appointments.status, "checked-in"),
        gte(appointments.attendedAt, startOfDay),
        sql`${queues.id} IS NULL` // No está en la cola
      ];

      // Si es staff, filtrar por su sede asignada
      if (req.user.role === 'staff') {
        if (!req.user.branchId) {
          return res.status(403).json({ message: "Staff user must be assigned to a branch" });
        }
        whereConditions.push(eq(appointments.branchId, req.user.branchId));
      }

      // Obtener citas con check-in completado de hoy que NO están en la cola
      const checkedInAppointments = await db
        .select({
          id: appointments.id,
          userId: appointments.userId,
          serviceId: appointments.serviceId,
          branchId: appointments.branchId,
          confirmationCode: appointments.confirmationCode,
          status: appointments.status,
          scheduledAt: appointments.scheduledAt,
          attendedAt: appointments.attendedAt,
          userName: users.username,
          userEmail: users.email,
          serviceName: services.name,
          serviceDescription: services.description
        })
        .from(appointments)
        .innerJoin(users, eq(appointments.userId, users.id))
        .innerJoin(services, eq(appointments.serviceId, services.id))
        .leftJoin(queues, eq(queues.appointmentId, appointments.id))
        .where(and(...whereConditions))
        .orderBy(desc(appointments.attendedAt));

      res.json(checkedInAppointments);    } catch (error) {
      console.error('Error fetching checked-in appointments:', error);
      next(error);
    }  });

  // Queue Management
  app.get("/api/queue", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      if (req.user.role !== 'staff' && req.user.role !== 'admin' && req.user.role !== 'visualizer') {
        return res.status(403).send("Unauthorized");
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Construir condiciones de filtrado
      let whereConditions = [gte(queues.createdAt, startOfDay)];

      // Si es staff o visualizer, filtrar por su sede asignada
      if (req.user.role === 'staff' || req.user.role === 'visualizer') {
        if (!req.user.branchId) {
          const userType = req.user.role === 'staff' ? 'Staff' : 'Visualizer';
          return res.status(403).json({ message: `${userType} user must be assigned to a branch` });
        }
        whereConditions.push(eq(appointments.branchId, req.user.branchId));
      }

      const activeQueues = await db
        .select({
          id: queues.id,
          appointmentId: queues.appointmentId,
          counter: queues.counter,
          status: queues.status,
          createdAt: queues.createdAt,
          calledAt: queues.calledAt,
          completedAt: queues.completedAt,
          branchId: appointments.branchId,
          scheduledAt: appointments.scheduledAt,
          servicePointId: appointments.servicePointId,
          confirmationCode: appointments.confirmationCode,
          userName: users.username,
          serviceName: services.name
        })
        .from(queues)
        .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
        .innerJoin(users, eq(appointments.userId, users.id))
        .innerJoin(services, eq(appointments.serviceId, services.id))
        .where(and(...whereConditions))
        .orderBy(desc(queues.createdAt));

      res.json(activeQueues);
    } catch (error) {
      next(error);
    }
  });  app.post("/api/queue", async (req, res, next) => {
    try {
      if (!req.user || (req.user.role !== "staff" && req.user.role !== "admin")) {
        return res.status(403).json({
          message: "No autorizado para gestionar la cola"
        });
      }

      // Validar que staff tenga sede asignada
      if (req.user.role === 'staff' && !req.user.branchId) {
        return res.status(403).json({
          message: "Staff user must be assigned to a branch"
        });
      }

      const { appointmentId, servicePointId } = req.body;

      // Validar que se proporcionen los parámetros requeridos
      if (!appointmentId) {
        return res.status(400).json({
          message: "Se requiere el ID de la cita"
        });
      }

      if (!servicePointId) {
        return res.status(400).json({
          message: "Se requiere el ID del punto de atención"
        });
      }

      // Verificar que la cita existe y está completada (con check-in)
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return res.status(404).json({
          message: "Cita no encontrada"
        });
      }

      // Validar que staff solo gestione citas de su sede
      if (req.user.role === 'staff' && appointment.branchId !== req.user.branchId) {
        return res.status(403).json({
          message: "No autorizado para gestionar citas de otras sedes"
        });
      }

      if (appointment.status !== "checked-in") {
        return res.status(400).json({
          message: "La cita debe tener check-in completado antes de agregar a la cola"
        });
      }

      // Verificar que el punto de atención existe y está activo
      const [servicePoint] = await db
        .select()
        .from(servicePoints)
        .where(eq(servicePoints.id, servicePointId))
        .limit(1);

      if (!servicePoint) {
        return res.status(404).json({
          message: "Punto de atención no encontrado"
        });
      }

      if (!servicePoint.isActive) {
        return res.status(400).json({
          message: "El punto de atención no está activo"
        });
      }

      // Verificar que el punto de atención puede atender el servicio de la cita
      const [servicePointService] = await db
        .select()
        .from(servicePointServices)
        .where(
          and(
            eq(servicePointServices.servicePointId, servicePointId),
            eq(servicePointServices.serviceId, appointment.serviceId),
            eq(servicePointServices.isActive, true)
          )
        )
        .limit(1);

      if (!servicePointService) {
        return res.status(400).json({
          message: "El punto de atención seleccionado no puede atender este tipo de servicio"
        });
      }

      // Verificar que la cita no esté ya en la cola
      const [existingQueue] = await db
        .select()
        .from(queues)
        .where(eq(queues.appointmentId, appointmentId))
        .limit(1);

      if (existingQueue) {
        return res.status(400).json({
          message: "Esta cita ya está en la cola",
          queueEntry: existingQueue
        });
      }

      // Generar número de ticket para la cola
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Obtener el último número de ticket del día
      const [lastQueue] = await db
        .select()
        .from(queues)
        .where(gte(queues.createdAt, startOfDay))
        .orderBy(desc(queues.counter))
        .limit(1);

      const nextCounter = lastQueue ? lastQueue.counter + 1 : 1;      // Crear entrada en la cola
      const [queue] = await db
        .insert(queues)
        .values({
          appointmentId,
          counter: nextCounter,
          status: "waiting"
        })
        .returning();      // Actualizar el estado de la cita a "completed" y asignar el punto de atención

      const [updatedAppointment] = await db
        .update(appointments)
        .set({ 
          status: "completed",
          servicePointId: servicePointId
        })
        .where(eq(appointments.id, appointmentId))
        .returning();



      // Obtener información completa para la respuesta
      let userInfo = null;
      if (appointment.userId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, appointment.userId))
          .limit(1);
        userInfo = user;
      }

      const [serviceInfo] = await db
        .select()
        .from(services)
        .where(eq(services.id, appointment.serviceId))
        .limit(1);

      const responseData = {
        queueEntry: queue,
        appointment: updatedAppointment,
        user: userInfo,
        service: serviceInfo,
        message: `Cita agregada a la cola. Número de ticket: ${nextCounter}`
      };

      res.json(responseData);
    } catch (error) {
      console.error('Error adding to queue:', error);
      next(error);
    }
  });
  app.post("/api/queue/:id/status", async (req, res, next) => {
    try {
      if (!req.user || (req.user.role !== "staff" && req.user.role !== "admin")) {
        return res.status(403).json({
          message: "No autorizado para actualizar el estado"
        });
      }

      // Validar que staff tenga sede asignada
      if (req.user.role === 'staff' && !req.user.branchId) {
        return res.status(403).json({
          message: "Staff user must be assigned to a branch"
        });
      }

      const queueId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["waiting", "serving", "complete"].includes(status)) {
        return res.status(400).json({
          message: "Estado inválido"
        });
      }

      // Si es staff, verificar que la cola pertenece a su sede
      if (req.user.role === 'staff') {
        const [queueWithAppointment] = await db
          .select({
            queueId: queues.id,
            appointmentId: queues.appointmentId,
            branchId: appointments.branchId
          })
          .from(queues)
          .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
          .where(eq(queues.id, queueId))
          .limit(1);

        if (!queueWithAppointment) {
          return res.status(404).json({
            message: "Cola no encontrada"
          });
        }

        if (queueWithAppointment.branchId !== req.user.branchId) {
          return res.status(403).json({
            message: "No autorizado para gestionar colas de otras sedes"
          });
        }
      }

      const now = new Date();
      const updateData: any = { status };

      if (status === "serving") {
        updateData.calledAt = now;
      } else if (status === "complete") {
        updateData.completedAt = now;
      }

      const [updatedQueue] = await db
        .update(queues)
        .set(updateData)
        .where(eq(queues.id, queueId))
        .returning();

      if (!updatedQueue) {
        return res.status(404).json({
          message: "Cola no encontrada"
        });
      }

      if (status === "complete") {
        await db
          .update(appointments)
          .set({
            status: "completed",
            attendedAt: now
          })
          .where(eq(appointments.id, updatedQueue.appointmentId));
      }

      const message = JSON.stringify({
        type: "QUEUE_UPDATE",
        data: updatedQueue
      });


      res.json(updatedQueue);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para transferir citas entre puntos de atención
  app.patch("/api/queue/:id/transfer", async (req, res, next) => {
    try {
      if (!req.user || (req.user.role !== "staff" && req.user.role !== "admin")) {
        return res.status(403).json({
          message: "No autorizado para transferir citas"
        });
      }

      // Validar que staff tenga sede asignada
      if (req.user.role === 'staff' && !req.user.branchId) {
        return res.status(403).json({
          message: "Staff user must be assigned to a branch"
        });
      }

      const queueId = parseInt(req.params.id);
      const { servicePointId } = req.body;

      if (!servicePointId) {
        return res.status(400).json({
          message: "Se requiere el ID del nuevo punto de atención"
        });
      }

      // Obtener información de la cola y la cita
      const [queueWithAppointment] = await db
        .select({
          queueId: queues.id,
          queueStatus: queues.status,
          appointmentId: queues.appointmentId,
          appointmentServiceId: appointments.serviceId,
          appointmentBranchId: appointments.branchId,
          currentServicePointId: appointments.servicePointId
        })
        .from(queues)
        .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
        .where(eq(queues.id, queueId))
        .limit(1);

      if (!queueWithAppointment) {
        return res.status(404).json({
          message: "Cola no encontrada"
        });
      }

      // Validar que staff solo gestione citas de su sede
      if (req.user.role === 'staff' && queueWithAppointment.appointmentBranchId !== req.user.branchId) {
        return res.status(403).json({
          message: "No autorizado para gestionar citas de otras sedes"
        });
      }

      // Verificar que no se esté intentando transferir al mismo punto de atención
      if (queueWithAppointment.currentServicePointId === servicePointId) {
        return res.status(400).json({
          message: "La cita ya está asignada a este punto de atención"
        });
      }

      // Verificar que el nuevo punto de atención existe y está activo
      const [newServicePoint] = await db
        .select()
        .from(servicePoints)
        .where(eq(servicePoints.id, servicePointId))
        .limit(1);

      if (!newServicePoint) {
        return res.status(404).json({
          message: "Punto de atención no encontrado"
        });
      }

      if (!newServicePoint.isActive) {
        return res.status(400).json({
          message: "El punto de atención no está activo"
        });
      }

      // Verificar que el punto de atención pertenece a la misma sede (si es staff)
      if (req.user.role === 'staff' && newServicePoint.branchId !== req.user.branchId) {
        return res.status(403).json({
          message: "El punto de atención debe pertenecer a la misma sede"
        });
      }

      // Verificar que el nuevo punto de atención puede atender el servicio de la cita
      const [servicePointService] = await db
        .select()
        .from(servicePointServices)
        .where(
          and(
            eq(servicePointServices.servicePointId, servicePointId),
            eq(servicePointServices.serviceId, queueWithAppointment.appointmentServiceId),
            eq(servicePointServices.isActive, true)
          )
        )
        .limit(1);

      if (!servicePointService) {
        return res.status(400).json({
          message: "El punto de atención seleccionado no puede atender este tipo de servicio"
        });
      }

      // Actualizar el punto de atención en la cita
      const [updatedAppointment] = await db
        .update(appointments)
        .set({ servicePointId: servicePointId })
        .where(eq(appointments.id, queueWithAppointment.appointmentId))
        .returning();

      // Obtener información completa para la respuesta
      const [servicePointInfo] = await db
        .select()
        .from(servicePoints)
        .where(eq(servicePoints.id, servicePointId))
        .limit(1);

      const responseData = {
        queueId: queueId,
        appointmentId: queueWithAppointment.appointmentId,
        previousServicePointId: queueWithAppointment.currentServicePointId,
        newServicePointId: servicePointId,
        newServicePointName: servicePointInfo?.name,
        message: `Cita transferida exitosamente al punto de atención: ${servicePointInfo?.name}`
      };

      res.json(responseData);
    } catch (error) {
      console.error('Error transferring appointment:', error);
      next(error);
    }
  });

  // Rutas para gestionar formularios
  app.get("/api/forms", async (req, res, next) => {
    try {
      const allForms = await db.select().from(forms);
      res.json(allForms);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forms", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const [form] = await db
        .insert(forms)
        .values({
          name: req.body.name,
          description: req.body.description,
          isActive: req.body.isActive,
        })
        .returning();

      res.json(form);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/forms/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const formId = parseInt(req.params.id);
      const [updatedForm] = await db
        .update(forms)
        .set({
          name: req.body.name,
          description: req.body.description,
        })
        .where(eq(forms.id, formId))
        .returning();

      if (!updatedForm) {
        return res.status(404).json({ message: "Formulario no encontrado" });
      }

      res.json(updatedForm);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/forms/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const formId = parseInt(req.params.id);
      const { isActive } = req.body;

      const [updatedForm] = await db
        .update(forms)
        .set({ isActive })
        .where(eq(forms.id, formId))
        .returning();

      if (!updatedForm) {
        return res.status(404).json({ message: "Formulario no encontrado" });
      }

      res.json(updatedForm);
    } catch (error) {
      next(error);
    }
  });

  // Rutas para campos de formulario
  app.get("/api/forms/:formId/fields", async (req, res, next) => {
    try {
      const formId = parseInt(req.params.formId);

      const fields = await db
        .select()
        .from(formFields)
        .where(eq(formFields.formId, formId))
        .orderBy(formFields.order);

      res.json(fields);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/form-fields", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const [field] = await db
        .insert(formFields)
        .values({
          formId: req.body.formId,
          name: req.body.name,
          label: req.body.label,
          type: req.body.type,
          required: req.body.required,
          options: req.body.options,
          order: req.body.order,
          helperText: req.body.helperText // Agregar el campo de texto de ayuda
        })
        .returning();

      res.json(field);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/form-fields/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const formFieldId = parseInt(req.params.id);
      const [updatedFormField] = await db
        .update(formFields)
        .set(req.body)
        .where(eq(formFields.id, formFieldId))
        .returning();

      if (!updatedFormField) {
        return res.status(404).json({ message: "Campo de formulario no encontrado" });
      }

      res.json(updatedFormField);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/form-fields/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const fieldId = parseInt(req.params.id);

      await db
        .delete(formFields)
        .where(eq(formFields.id, fieldId));

      res.json({ success: true, message: "Campo eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  });

  // Ruta adicional para reordenar campos de formulario
  app.post("/api/forms/:formId/reorder-fields", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const formId = parseInt(req.params.formId);
      const { fields } = req.body;

      if (!Array.isArray(fields)) {
        return res.status(400).json({ message: "El formato de campos es inválido" });
      }

      // Procesamos cada campo en una transacción
      const updatedFields = await db.transaction(async (tx) => {
        const results = [];
        for (const field of fields) {
          const [updated] = await tx
            .update(formFields)
            .set({ order: field.order })
            .where(eq(formFields.id, field.id))
            .returning();

          if (updated) {
            results.push(updated);
          }
        }
        return results;
      });

      res.json({
        success: true,
        message: "Campos reordenados correctamente",
        fields: updatedFields
      });
    } catch (error) {
      next(error);
    }
  });

  // Añadir este endpoint después de las rutas existentes para campos de formulario
  // Ruta para generar texto de ayuda con IA
  app.post("/api/form-fields/generate-helper-text", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { fieldName, fieldLabel, fieldType, formId } = req.body;

      if (!fieldName || !fieldLabel || !fieldType) {
        return res.status(400).json({
          message: "Faltan datos requeridos: fieldName, fieldLabel y fieldType son obligatorios"
        });
      }

      // Obtener información adicional sobre el formulario para contexto
      const [form] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, formId))
        .limit(1);

      if (!form) {
        return res.status(404).json({ message: "Formulario no encontrado" });
      }

      // Aquí generaríamos el texto con OpenAI API, pero por ahora generamos textos predefinidos
      // basados en el tipo de campo y su etiqueta
      let helperText = "";

      switch (fieldType) {
        case "text":
          helperText = `Ingrese su ${fieldLabel.toLowerCase()} como aparece en su documento de identidad.`;
          break;
        case "email":
          helperText = `Proporcione un correo electrónico válido donde podamos contactarlo acerca de su ${form.name.toLowerCase()}.`;
          break;
        case "number":
          helperText = `Ingrese solamente números en este campo de ${fieldLabel.toLowerCase()}.`;
          break;
        case "date":
          helperText = `Seleccione la fecha de ${fieldLabel.toLowerCase()} utilizando el calendario o escribiendo en formato DD/MM/AAAA.`;
          break;
        case "select":
          helperText = `Seleccione una opción de la lista desplegable para ${fieldLabel.toLowerCase()}.`;
          break;
        case "checkbox":
          helperText = `Marque esta casilla si ${fieldLabel.toLowerCase()} aplica a su situación.`;
          break;
        case "textarea":
          helperText = `Proporcione detalles adicionales sobre ${fieldLabel.toLowerCase()} en este espacio. Sea claro y conciso.`;
          break;
        default:
          helperText = `Complete este campo con su información de ${fieldLabel.toLowerCase()}.`;
      }

      // Si el nombre del campo sugiere ciertos tipos de datos, podemos personalizarlo aún más
      if (fieldName.includes("name") || fieldName.includes("nombre")) {
        helperText = "Ingrese su nombre completo como aparece en su documento de identidad.";
      } else if (fieldName.includes("phone") || fieldName.includes("telefono")) {
        helperText = "Ingrese su número telefónico incluyendo el código de área, sin espacios ni guiones.";
      } else if (fieldName.includes("address") || fieldName.includes("direccion")) {
        helperText = "Ingrese su dirección completa incluyendo calle, número, ciudad y código postal.";
      } else if (fieldName.includes("id") || fieldName.includes("identificacion")) {
        helperText = "Ingrese su número de identificación sin espacios ni caracteres especiales.";
      }      // Devolver el texto generado
      res.json({
        helperText,
        message: "Texto de ayuda generado con éxito"
      });    } catch (error) {
      next(error);
    }  });
  // Self Services Routes
  app.get("/api/self-services", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin" && req.user?.role !== "selfservice") {
        return res.status(403).json({ message: "No autorizado" });
      }

      // Si es usuario selfservice, verificar que tenga sede asignada
      if (req.user.role === "selfservice" && !req.user.branchId) {
        return res.status(403).json({ message: "Usuario selfservice debe estar asignado a una sede" });
      }

      let allSelfServices;

      if (req.user.role === "admin") {
        // Admin ve todos los autoservicios
        allSelfServices = await db
          .select({
            id: selfServices.id,
            name: selfServices.name,
            description: selfServices.description,
            isActive: selfServices.isActive,
            createdAt: selfServices.createdAt,
          })
          .from(selfServices);
      } else {
        // Selfservice solo ve autoservicios de su sede
        allSelfServices = await db
          .select({
            id: selfServices.id,
            name: selfServices.name,
            description: selfServices.description,
            isActive: selfServices.isActive,
            createdAt: selfServices.createdAt,
          })
          .from(selfServices)
          .innerJoin(selfServiceServicePoints, eq(selfServices.id, selfServiceServicePoints.selfServiceId))
          .innerJoin(servicePoints, eq(selfServiceServicePoints.servicePointId, servicePoints.id))          .where(
            and(
              eq(servicePoints.branchId, req.user.branchId!),
              eq(selfServices.isActive, true),
              eq(selfServiceServicePoints.isActive, true),
              eq(servicePoints.isActive, true)
            )
          )
          .groupBy(selfServices.id); // Evitar duplicados si un autoservicio tiene múltiples puntos en la misma sede
      }

      // Get service points and services for each self-service
      const selfServicesWithDetails = await Promise.all(
        allSelfServices.map(async (selfService) => {
          // Get assigned service points
          const assignedServicePoints = await db
            .select({
              id: servicePoints.id,
              name: servicePoints.name,
              description: servicePoints.description,
              isActive: servicePoints.isActive,
            })
            .from(selfServiceServicePoints)
            .leftJoin(servicePoints, eq(selfServiceServicePoints.servicePointId, servicePoints.id))
            .where(eq(selfServiceServicePoints.selfServiceId, selfService.id));

          // Get assigned services
          const assignedServices = await db
            .select({
              id: services.id,
              name: services.name,
              description: services.description,
              duration: services.duration,
              isActive: services.isActive,
            })
            .from(selfServiceServices)
            .leftJoin(services, eq(selfServiceServices.serviceId, services.id))
            .where(eq(selfServiceServices.selfServiceId, selfService.id));

          return {
            ...selfService,
            servicePoints: assignedServicePoints,
            services: assignedServices,
          };
        })
      );

      res.json(selfServicesWithDetails);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/self-services/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin" && req.user?.role !== "selfservice") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const selfServiceId = parseInt(req.params.id);

      const [selfService] = await db
        .select({
          id: selfServices.id,
          name: selfServices.name,
          description: selfServices.description,
          isActive: selfServices.isActive,
          createdAt: selfServices.createdAt,
        })
        .from(selfServices)
        .where(eq(selfServices.id, selfServiceId))
        .limit(1);

      if (!selfService) {
        return res.status(404).json({ message: "Autoservicio no encontrado" });
      }

      // Get assigned service points
      const assignedServicePoints = await db
        .select({
          id: servicePoints.id,
          name: servicePoints.name,
          description: servicePoints.description,
          isActive: servicePoints.isActive,
        })
        .from(selfServiceServicePoints)
        .leftJoin(servicePoints, eq(selfServiceServicePoints.servicePointId, servicePoints.id))
        .where(eq(selfServiceServicePoints.selfServiceId, selfServiceId));

      // Get assigned services
      const assignedServices = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          isActive: services.isActive,
        })
        .from(selfServiceServices)
        .leftJoin(services, eq(selfServiceServices.serviceId, services.id))
        .where(eq(selfServiceServices.selfServiceId, selfServiceId));

      res.json({
        ...selfService,
        servicePoints: assignedServicePoints,
        services: assignedServices,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/self-services", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { name, description, servicePointIds, serviceIds } = req.body;

      if (!name || !servicePointIds || !Array.isArray(servicePointIds) || servicePointIds.length === 0) {
        return res.status(400).json({ 
          message: "Nombre y al menos un punto de atención son requeridos" 
        });
      }

      // Create self-service
      const [newSelfService] = await db
        .insert(selfServices)
        .values({
          name,
          description,
          isActive: true,
        })
        .returning();

      // Assign service points
      if (servicePointIds && servicePointIds.length > 0) {
        await db.insert(selfServiceServicePoints).values(
          servicePointIds.map((servicePointId: number) => ({
            selfServiceId: newSelfService.id,
            servicePointId,
            isActive: true,
          }))
        );
      }

      // Assign services if provided
      if (serviceIds && serviceIds.length > 0) {
        await db.insert(selfServiceServices).values(
          serviceIds.map((serviceId: number) => ({
            selfServiceId: newSelfService.id,
            serviceId,
            isActive: true,
          }))
        );
      }

      res.json(newSelfService);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/self-services/:id", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const selfServiceId = parseInt(req.params.id);
      const { name, description, servicePointIds, serviceIds } = req.body;

      // Update self-service
      const [updatedSelfService] = await db
        .update(selfServices)
        .set({
          name,
          description,
        })
        .where(eq(selfServices.id, selfServiceId))
        .returning();

      if (!updatedSelfService) {
        return res.status(404).json({ message: "Autoservicio no encontrado" });
      }

      // Update service point assignments
      // First, remove all existing service point assignments
      await db
        .delete(selfServiceServicePoints)
        .where(eq(selfServiceServicePoints.selfServiceId, selfServiceId));

      // Then add new service point assignments
      if (servicePointIds && servicePointIds.length > 0) {
        await db.insert(selfServiceServicePoints).values(
          servicePointIds.map((servicePointId: number) => ({
            selfServiceId,
            servicePointId,
            isActive: true,
          }))
        );
      }

      // Update service assignments
      // First, remove all existing service assignments
      await db
        .delete(selfServiceServices)
        .where(eq(selfServiceServices.selfServiceId, selfServiceId));

      // Then add new service assignments
      if (serviceIds && serviceIds.length > 0) {
        await db.insert(selfServiceServices).values(
          serviceIds.map((serviceId: number) => ({
            selfServiceId,
            serviceId,
            isActive: true,
          }))
        );
      }

      res.json(updatedSelfService);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/self-services/:id/status", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const selfServiceId = parseInt(req.params.id);
      const { isActive } = req.body;

      const [updatedSelfService] = await db
        .update(selfServices)
        .set({ isActive })
        .where(eq(selfServices.id, selfServiceId))
        .returning();

      if (!updatedSelfService) {
        return res.status(404).json({ message: "Autoservicio no encontrado" });
      }      res.json(updatedSelfService);
    } catch (error) {
      next(error);
    }  });
  // Generate Turn Routes
  app.post("/api/generate-turn", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Validar acceso por rol
      if (req.user.role !== "admin" && req.user.role !== "selfservice") {
        return res.status(403).json({ message: "No autorizado para generar turnos" });
      }

      // Si es usuario selfservice, verificar que tenga sede asignada
      if (req.user.role === "selfservice" && !req.user.branchId) {
        return res.status(403).json({ message: "Usuario selfservice debe estar asignado a una sede" });
      }

      const { serviceId, servicePointId, formData } = req.body;

      if (!serviceId || !servicePointId) {
        return res.status(400).json({ 
          message: "ServiceId y servicePointId son requeridos" 
        });
      }

      // Verify service exists and is active
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!service || !service.isActive) {
        return res.status(404).json({ message: "Servicio no encontrado o inactivo" });
      }

      // Verify service point exists and is active
      const [servicePoint] = await db
        .select()
        .from(servicePoints)
        .where(eq(servicePoints.id, servicePointId))
        .limit(1);      if (!servicePoint || !servicePoint.isActive) {
        return res.status(404).json({ message: "Punto de atención no encontrado o inactivo" });
      }

      // Si es usuario selfservice, verificar que el punto de atención pertenezca a su sede
      if (req.user.role === "selfservice" && servicePoint.branchId !== req.user.branchId) {
        return res.status(403).json({ 
          message: "No puede generar turnos para puntos de atención de otras sedes" 
        });
      }

      // Verify service point can handle this service
      const servicePointServiceRelation = await db
        .select()
        .from(servicePointServices)
        .where(
          and(
            eq(servicePointServices.servicePointId, servicePointId),
            eq(servicePointServices.serviceId, serviceId),
            eq(servicePointServices.isActive, true)
          )
        )
        .limit(1);

      if (!servicePointServiceRelation.length) {
        return res.status(400).json({ 
          message: "El punto de atención seleccionado no puede atender este servicio" 
        });
      }      // Obtener la sede del punto de atención seleccionado
      const [servicePointInfo] = await db
        .select({ branchId: servicePoints.branchId })
        .from(servicePoints)
        .where(eq(servicePoints.id, servicePointId))
        .limit(1);

      if (!servicePointInfo || !servicePointInfo.branchId) {
        return res.status(400).json({ 
          message: "El punto de atención debe estar asignado a una sede válida" 
        });
      }

      // Generate confirmation code
      const confirmationCode = generateConfirmationCode();
      
      // Create appointment as turn type
      const [newAppointment] = await db
        .insert(appointments)
        .values({
          userId: req.user.id,
          serviceId,
          branchId: servicePointInfo.branchId, // Sede obtenida del punto de atención
          servicePointId,
          confirmationCode,
          type: 'turn',
          status: 'scheduled',
          scheduledAt: new Date(),
          formData: formData || null,
        })
        .returning();

      // Generate QR code for the turn
      let updatedAppointment = newAppointment;
      try {
        const qrCode = await generateAppointmentQR(newAppointment);
        
        // Update appointment with QR code
        [updatedAppointment] = await db
          .update(appointments)
          .set({ qrCode })
          .where(eq(appointments.id, newAppointment.id))
          .returning();
      } catch (qrError) {
        console.error('Error generating QR code for turn:', qrError);
        // Continue without QR if generation fails
      }      // Add to queue immediately
      const [queueEntry] = await db
        .insert(queues)
        .values({
          appointmentId: updatedAppointment.id,
          counter: servicePointId,
          status: 'waiting',
        })
        .returning();

      // Get queue position (count of waiting entries for this service point)
      const queuePosition = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(queues)
        .where(
          and(
            eq(queues.counter, servicePointId),
            eq(queues.status, 'waiting'),
            sql`${queues.id} <= ${queueEntry.id}`
          )
        );

      // Calculate estimated wait time (rough estimate)
      const estimatedWait = Math.max(5, (queuePosition[0]?.count || 1) * (service.duration || 15));

      res.json({
        appointment: updatedAppointment,
        queueEntry,
        queuePosition: queuePosition[0]?.count || 1,
        estimatedWait,
        servicePoint,
        service
      });

    } catch (error) {
      console.error('Error generating turn:', error);      next(error);
    }
  });  // Staff Assignment (Asignación de Personal)
  // Obtener todos los usuarios staff con sus asignaciones de sede
  app.get("/api/staff-assignments", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const staffUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          branchId: users.branchId,
          branchName: branches.name,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .leftJoin(branches, eq(users.branchId, branches.id))
        .where(eq(users.role, "staff"));

      res.json(staffUsers);
    } catch (error) {
      next(error);
    }
  });  // Obtener staff sin asignar (disponibles para asignación)
  app.get("/api/staff-assignments/available", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const availableStaff = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .where(and(
          eq(users.role, "staff"),
          eq(users.isActive, true),
          sql`${users.branchId} IS NULL`
        ));

      res.json(availableStaff);
    } catch (error) {
      next(error);
    }
  });  // Obtener staff asignados a una sede específica
  app.get("/api/branches/:branchId/staff", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const branchId = parseInt(req.params.branchId);
      
      const branchStaff = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          branchId: users.branchId,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .where(and(
          eq(users.role, "staff"),
          eq(users.branchId, branchId),
          eq(users.isActive, true)
        ));

      res.json(branchStaff);
    } catch (error) {
      next(error);
    }
  });
  // Asignar un operador a una sede
  app.post("/api/staff-assignments", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { userId, branchId } = req.body;

      if (!userId || !branchId) {
        return res.status(400).json({ message: "userId y branchId son requeridos" });
      }

      // Verificar que el usuario existe y es staff
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.role, "staff")))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Usuario staff no encontrado" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Verificar que el usuario no esté ya asignado a una sede
      if (user.branchId) {
        return res.status(400).json({ message: "El operador ya está asignado a una sede" });
      }

      // Asignar el operador a la sede
      const [updatedUser] = await db
        .update(users)
        .set({ branchId })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Error al asignar operador" });
      }

      res.json({
        message: "Operador asignado exitosamente",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          branchId: updatedUser.branchId,
          branchName: branch.name
        }
      });
    } catch (error) {
      next(error);
    }
  });
  // Desasignar un operador de su sede
  app.delete("/api/staff-assignments/:userId", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const userId = parseInt(req.params.userId);

      // Verificar que el usuario existe y es staff
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.role, "staff")))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Usuario staff no encontrado" });
      }

      if (!user.branchId) {
        return res.status(400).json({ message: "El operador no está asignado a ninguna sede" });
      }

      // Desasignar el operador
      const [updatedUser] = await db
        .update(users)
        .set({ branchId: null })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Error al desasignar operador" });
      }

      res.json({
        message: "Operador desasignado exitosamente",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          branchId: null
        }
      });
    } catch (error) {
      next(error);
    }
  });
  // Reasignar un operador a una nueva sede
  app.put("/api/staff-assignments/:userId", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const userId = parseInt(req.params.userId);
      const { branchId } = req.body;

      if (!branchId) {
        return res.status(400).json({ message: "branchId es requerido" });
      }

      // Verificar que el usuario existe y es staff
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.role, "staff")))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Usuario staff no encontrado" });
      }

      // Verificar que la nueva sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Reasignar el operador
      const [updatedUser] = await db
        .update(users)
        .set({ branchId })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Error al reasignar operador" });
      }

      res.json({
        message: "Operador reasignado exitosamente",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          branchId: updatedUser.branchId,
          branchName: branch.name
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Endpoint específico para asignar sede a usuarios (especialmente staff y selfservice)
  app.put("/api/users/:id/branch", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const userId = parseInt(req.params.id);
      const { branchId } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      // Verificar que el usuario existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Si se proporciona branchId, verificar que la sede existe
      if (branchId !== null && branchId !== undefined) {
        const [branch] = await db
          .select()
          .from(branches)
          .where(eq(branches.id, branchId))
          .limit(1);

        if (!branch) {
          return res.status(404).json({ message: "Sede no encontrada" });
        }

        if (!branch.isActive) {
          return res.status(400).json({ message: "La sede seleccionada no está activa" });
        }
      }

      // Actualizar la asignación de sede
      const [updatedUser] = await db
        .update(users)
        .set({ branchId })
        .where(eq(users.id, userId))
        .returning();

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({
        user: userWithoutPassword,
        message: branchId 
          ? `Usuario asignado a la sede correctamente` 
          : `Usuario desasignado de la sede correctamente`
      });
    } catch (error) {
      next(error);
    }
  });
  // Endpoint para obtener usuarios filtrados por rol y estado de asignación de sede
  app.get("/api/users/by-role/:role", async (req, res, next) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { role } = req.params;
      const { includeUnassigned } = req.query;

      // Validar que el rol sea válido
      const validRoles = ["user", "admin", "staff", "selfservice", "visualizer"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Rol inválido" });
      }

      // Construir condiciones de filtrado
      let whereConditions = [eq(users.role, role as any)];

      // Si se solicita incluir solo usuarios sin asignar
      if (includeUnassigned === 'true') {
        whereConditions.push(sql`${users.branchId} IS NULL`);
      }

      const filteredUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          branchId: users.branchId,
          isActive: users.isActive,
          mustChangePassword: users.mustChangePassword,
          createdAt: users.createdAt,
          branchName: branches.name,
        })
        .from(users)
        .leftJoin(branches, eq(users.branchId, branches.id))
        .where(and(...whereConditions))
        .orderBy(users.username);

      res.json(filteredUsers);
    } catch (error) {
      next(error);
    }  });

  // Selfservice-specific routes with branch filtering
  // GET services available for selfservice users (filtered by their assigned branch)
  app.get("/api/selfservice/services", async (req, res, next) => {
    try {
      if (req.user?.role !== "selfservice") {
        return res.status(403).json({ message: "No autorizado - solo usuarios selfservice" });
      }

      if (!req.user.branchId) {
        return res.status(403).json({ message: "Usuario selfservice debe estar asignado a una sede" });
      }      // Get services available in the user's branch
      const availableServices = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          isActive: services.isActive,
          formId: services.formId,
        })
        .from(services)
        .innerJoin(branchServices, eq(services.id, branchServices.serviceId))
        .where(
          and(
            eq(branchServices.branchId, req.user.branchId),
            eq(services.isActive, true),
            eq(branchServices.isActive, true)
          )
        )
        .orderBy(services.name);

      res.json(availableServices);
    } catch (error) {
      next(error);
    }
  });

  // GET service points available for selfservice users (filtered by their assigned branch)
  app.get("/api/selfservice/service-points", async (req, res, next) => {
    try {
      if (req.user?.role !== "selfservice") {
        return res.status(403).json({ message: "No autorizado - solo usuarios selfservice" });
      }

      if (!req.user.branchId) {
        return res.status(403).json({ message: "Usuario selfservice debe estar asignado a una sede" });
      }

      // Get service points in the user's branch
      const branchServicePoints = await db
        .select({
          id: servicePoints.id,
          name: servicePoints.name,
          description: servicePoints.description,
          isActive: servicePoints.isActive,
          branchId: servicePoints.branchId,
        })
        .from(servicePoints)
        .where(
          and(
            eq(servicePoints.branchId, req.user.branchId),
            eq(servicePoints.isActive, true)
          )
        )
        .orderBy(servicePoints.name);

      res.json(branchServicePoints);
    } catch (error) {
      next(error);
    }
  });

  // GET service points that can handle a specific service (filtered by branch for selfservice users)
  app.get("/api/selfservice/services/:serviceId/service-points", async (req, res, next) => {
    try {
      if (req.user?.role !== "selfservice") {
        return res.status(403).json({ message: "No autorizado - solo usuarios selfservice" });
      }

      if (!req.user.branchId) {
        return res.status(403).json({ message: "Usuario selfservice debe estar asignado a una sede" });
      }

      const serviceId = parseInt(req.params.serviceId);

      // Verify service exists and is available in user's branch
      const [service] = await db
        .select({ id: services.id })
        .from(services)
        .innerJoin(branchServices, eq(services.id, branchServices.serviceId))
        .where(
          and(
            eq(services.id, serviceId),
            eq(branchServices.branchId, req.user.branchId),
            eq(services.isActive, true),
            eq(branchServices.isActive, true)
          )
        )
        .limit(1);

      if (!service) {
        return res.status(404).json({ message: "Servicio no encontrado o no disponible en su sede" });
      }

      // Get service points that can handle this service in the user's branch
      const availableServicePoints = await db
        .select({
          id: servicePoints.id,
          name: servicePoints.name,
          description: servicePoints.description,
          isActive: servicePoints.isActive,
          branchId: servicePoints.branchId,
        })
        .from(servicePoints)
        .innerJoin(servicePointServices, eq(servicePoints.id, servicePointServices.servicePointId))
        .where(
          and(
            eq(servicePointServices.serviceId, serviceId),
            eq(servicePoints.branchId, req.user.branchId),
            eq(servicePoints.isActive, true),
            eq(servicePointServices.isActive, true)
          )
        )
        .orderBy(servicePoints.name);

      res.json(availableServicePoints);
    } catch (error) {
      next(error);
    }
  });

  // === ENDPOINTS PARA SISTEMA DE ENCUESTAS DE SATISFACCIÓN ===
  
  /**
   * Crear una encuesta de satisfacción al finalizar una atención.
   * POST /api/surveys
   * 
   * Body: {
   *   appointmentId?: number,
   *   queueId?: number,
   *   emailAddress?: string,
   *   patientName?: string
   * }
   */
  app.post("/api/surveys", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      // Solo staff y admin pueden crear encuestas
      if (!["staff", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado - Solo staff/admin pueden crear encuestas" });
      }

      const { appointmentId, queueId, emailAddress, patientName } = req.body;

      // Validar que se proporcione appointmentId o queueId
      if (!appointmentId && !queueId) {
        return res.status(400).json({ message: "Se requiere appointmentId o queueId" });
      }

      let appointment = null;
      let queue = null;
      let branchId = null;
      let serviceId = null;
      let userId = null;
      let finalEmailAddress = emailAddress;
      let finalPatientName = patientName;

      // Si se proporciona appointmentId, obtener datos de la cita
      if (appointmentId) {
        [appointment] = await db
          .select()
          .from(appointments)
          .where(eq(appointments.id, appointmentId))
          .limit(1);

        if (!appointment) {
          return res.status(404).json({ message: "Cita no encontrada" });
        }

        // Obtener datos del usuario para la cita (solo si hay userId)
        let user = null;
        if (appointment.userId) {
          const [userData] = await db
            .select()
            .from(users)
            .where(eq(users.id, appointment.userId))
            .limit(1);
          user = userData;
        }

        branchId = appointment.branchId;
        serviceId = appointment.serviceId;
        userId = appointment.userId;
        
        if (!finalEmailAddress && user) {
          finalEmailAddress = user.email;
        }
        if (!finalPatientName && user) {
          finalPatientName = user.username;
        }
      }

      // Si se proporciona queueId, obtener datos de la cola
      if (queueId) {
        [queue] = await db
          .select()
          .from(queues)
          .where(eq(queues.id, queueId))
          .limit(1);

        if (!queue) {
          return res.status(404).json({ message: "Entrada de cola no encontrada" });
        }

        // Si hay appointmentId en la cola, obtener datos de la cita
        if (queue.appointmentId) {
          [appointment] = await db
            .select()
            .from(appointments)
            .where(eq(appointments.id, queue.appointmentId))
            .limit(1);

          if (appointment) {
            branchId = appointment.branchId;
            serviceId = appointment.serviceId;
            userId = appointment.userId;

            // Obtener datos del usuario si no se proporcionaron
            if ((!finalEmailAddress || !finalPatientName) && appointment.userId) {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, appointment.userId))
                .limit(1);

              if (user) {
                if (!finalEmailAddress) finalEmailAddress = user.email;
                if (!finalPatientName) finalPatientName = user.username;
              }
            }
          }
        }
      }

      // Validar que tengamos los datos necesarios
      if (!branchId || !serviceId) {
        return res.status(400).json({ message: "No se pueden determinar la sede y servicio" });
      }

      // Verificar que no exista ya una encuesta para esta cita/cola
      const existingSurvey = await db
        .select()
        .from(surveys)
        .where(
          appointmentId 
            ? eq(surveys.appointmentId, appointmentId)
            : eq(surveys.queueId, queueId!)
        )
        .limit(1);

      if (existingSurvey.length > 0) {
        const survey = existingSurvey[0];
        return res.status(409).json({ 
          message: "Ya existe una encuesta para esta atención",
          id: survey.id,
          surveyToken: survey.surveyToken,
          token: survey.surveyToken, // Alias para compatibilidad
          qrCode: survey.qrCode,
          isCompleted: survey.isCompleted,
          patientName: survey.patientName,
          createdAt: survey.createdAt
        });
      }

      // Generar token único para la encuesta
      const surveyToken = randomBytes(32).toString('hex');

      // Generar QR code para la encuesta
      const qrData = {
        type: 'survey',
        token: surveyToken,
        url: `${process.env.APP_URL || 'http://localhost:5000'}/survey/${surveyToken}`
      };
      const qrCode = await generateSurveyQR(surveyToken);


      // Crear la encuesta
      const [newSurvey] = await db
        .insert(surveys)
        .values({
          appointmentId: appointmentId || null,
          queueId: queueId || null,
          userId: userId || null,
          branchId,
          serviceId,
          surveyToken,
          emailAddress: finalEmailAddress || null,
          patientName: finalPatientName || null,
          qrCode,
          emailSent: false,
          isCompleted: false
        })
        .returning();

      // Enviar email si se proporcionó dirección
      if (finalEmailAddress) {
        try {
          await emailService.sendSurveyEmail({
            email: finalEmailAddress,
            patientName: finalPatientName || 'Estimado cliente',
            token: surveyToken,
            qrCode,
            serviceName: await getServiceName(serviceId),
            branchName: await getBranchName(branchId)
          });

          // Actualizar que el email fue enviado
          await db
            .update(surveys)
            .set({
              emailSent: true,
              emailSentAt: new Date()
            })
            .where(eq(surveys.id, newSurvey.id));

        } catch (emailError) {
          console.error('Error enviando email de encuesta:', emailError);
          // No fallar la creación de encuesta si falla el email
        }
      }

      res.status(201).json({
        id: newSurvey.id,
        surveyToken: newSurvey.surveyToken,
        token: newSurvey.surveyToken, // Alias para compatibilidad
        qrCode: newSurvey.qrCode,
        isCompleted: newSurvey.isCompleted,
        patientName: newSurvey.patientName,
        createdAt: newSurvey.createdAt,
        message: "Encuesta creada exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener encuesta existente por queueId.
   * GET /api/surveys/queue/:queueId
   */
  app.get("/api/surveys/queue/:queueId", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const queueId = parseInt(req.params.queueId);

      const [existingSurvey] = await db
        .select({
          id: surveys.id,
          surveyToken: surveys.surveyToken,
          qrCode: surveys.qrCode,
          isCompleted: surveys.isCompleted,
          patientName: surveys.patientName,
          createdAt: surveys.createdAt
        })
        .from(surveys)
        .where(eq(surveys.queueId, queueId))
        .limit(1);

      if (!existingSurvey) {
        return res.status(404).json({ message: "No existe encuesta para esta cola" });
      }

      res.json({
        id: existingSurvey.id,
        token: existingSurvey.surveyToken,
        qrCode: existingSurvey.qrCode,
        isCompleted: existingSurvey.isCompleted,
        patientName: existingSurvey.patientName,
        createdAt: existingSurvey.createdAt
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener encuesta por token (acceso público).
   * GET /api/surveys/token/:token
   */
  app.get("/api/surveys/token/:token", async (req, res, next) => {
    try {
      const { token } = req.params;

      const [survey] = await db
        .select({
          id: surveys.id,
          appointmentId: surveys.appointmentId,
          queueId: surveys.queueId,
          patientName: surveys.patientName,
          isCompleted: surveys.isCompleted,
          completedAt: surveys.completedAt,
          branchId: surveys.branchId,
          serviceId: surveys.serviceId,
          createdAt: surveys.createdAt
        })
        .from(surveys)
        .where(eq(surveys.surveyToken, token))
        .limit(1);

      if (!survey) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }

      // Obtener las preguntas activas de la sede específica
      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(
          and(
            eq(surveyQuestions.isActive, true),
            eq(surveyQuestions.branchId, survey.branchId)
          )
        )
        .orderBy(surveyQuestions.order);

      // Obtener información adicional (servicio, sede)
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, survey.serviceId))
        .limit(1);

      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, survey.branchId))
        .limit(1);

      res.json({
        survey,
        questions,
        service,
        branch
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Enviar respuestas de encuesta.
   * POST /api/surveys/:id/responses
   * 
   * Body: {
   *   responses: [
   *     { questionId: number, response: string, numericValue?: number }
   *   ]
   * }
   */
  app.post("/api/surveys/:id/responses", async (req, res, next) => {
    try {
      const surveyId = parseInt(req.params.id);
      const { responses } = req.body;

      if (!responses || !Array.isArray(responses)) {
        return res.status(400).json({ message: "Se requiere un array de respuestas" });
      }

      // Verificar que la encuesta existe y no está completada
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, surveyId))
        .limit(1);

      if (!survey) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }

      if (survey.isCompleted) {
        return res.status(409).json({ message: "Esta encuesta ya ha sido completada" });
      }

      // Validar que todas las preguntas requeridas estén respondidas (solo de la sede específica)
      const requiredQuestions = await db
        .select()
        .from(surveyQuestions)
        .where(and(
          eq(surveyQuestions.isActive, true),
          eq(surveyQuestions.isRequired, true),
          eq(surveyQuestions.branchId, survey.branchId)
        ));

      const answeredQuestionIds = responses.map(r => r.questionId);
      const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));

      if (missingRequired.length > 0) {
        return res.status(400).json({
          message: "Faltan respuestas para preguntas requeridas",
          missingQuestions: missingRequired.map(q => ({ id: q.id, question: q.question }))
        });
      }

      // Insertar todas las respuestas
      const responsePromises = responses.map(response => 
        db.insert(surveyResponses).values({
          surveyId,
          questionId: response.questionId,
          response: response.response,
          numericValue: response.numericValue || null
        })
      );

      await Promise.all(responsePromises);

      // Calcular calificación general si hay preguntas de rating
      let overallRating = null;
      const ratingResponses = responses.filter(r => r.numericValue && r.numericValue >= 1 && r.numericValue <= 5);
      if (ratingResponses.length > 0) {
        const avgRating = ratingResponses.reduce((sum, r) => sum + r.numericValue!, 0) / ratingResponses.length;
        overallRating = Math.round(avgRating);
      }

      // Marcar encuesta como completada
      await db
        .update(surveys)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          overallRating
        })
        .where(eq(surveys.id, surveyId));

      res.json({
        message: "Respuestas guardadas exitosamente",
        surveyCompleted: true,
        overallRating
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener encuestas del usuario autenticado.
   * GET /api/surveys/user
   */
  app.get("/api/surveys/user", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const userSurveys = await db
        .select({
          id: surveys.id,
          appointmentId: surveys.appointmentId,
          queueId: surveys.queueId,
          isCompleted: surveys.isCompleted,
          completedAt: surveys.completedAt,
          overallRating: surveys.overallRating,
          createdAt: surveys.createdAt,
          serviceName: services.name,
          branchName: branches.name
        })
        .from(surveys)
        .leftJoin(services, eq(surveys.serviceId, services.id))
        .leftJoin(branches, eq(surveys.branchId, branches.id))
        .where(eq(surveys.userId, req.user.id))
        .orderBy(desc(surveys.createdAt));

      res.json(userSurveys);

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener lista de encuestas individuales para gestión (admin/staff).
   * GET /api/surveys/list
   */
  app.get("/api/surveys/list", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { branchId, startDate, endDate } = req.query;
      
      let whereConditions = [];
      
      if (branchId) {
        whereConditions.push(eq(surveys.branchId, parseInt(branchId as string)));
      }
      
      if (startDate) {
        whereConditions.push(gte(surveys.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(surveys.createdAt, new Date(endDate as string)));
      }

      // Para staff, solo mostrar datos de su sede
      if (req.user.role === "staff" && req.user.branchId) {
        whereConditions.push(eq(surveys.branchId, req.user.branchId));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Obtener encuestas con información relacionada
      const surveysList = await db
        .select({
          id: surveys.id,
          userId: surveys.userId,
          serviceId: surveys.serviceId,
          branchId: surveys.branchId,
          token: surveys.surveyToken,
          status: sql<string>`CASE 
            WHEN ${surveys.isCompleted} = true THEN 'completed'
            WHEN ${surveys.createdAt} < NOW() - INTERVAL '30 days' THEN 'expired'
            ELSE 'pending'
          END`,
          createdAt: surveys.createdAt,
          completedAt: surveys.completedAt,
          // Información del usuario
          username: sql<string>`COALESCE(${users.username}, ${surveys.patientName})`,
          userEmail: sql<string>`COALESCE(${users.email}, ${surveys.emailAddress})`,
          // Información del servicio
          serviceName: services.name,
          // Información de la sede
          branchName: branches.name
        })
        .from(surveys)
        .leftJoin(users, eq(surveys.userId, users.id))
        .leftJoin(services, eq(surveys.serviceId, services.id))
        .leftJoin(branches, eq(surveys.branchId, branches.id))
        .where(whereClause)
        .orderBy(desc(surveys.createdAt))
        .limit(100); // Limitar para evitar resultados muy grandes

      // Transformar los datos para que coincidan con la estructura esperada por el frontend
      const formattedSurveys = surveysList.map(survey => ({
        id: survey.id,
        userId: survey.userId,
        serviceId: survey.serviceId,
        branchId: survey.branchId,
        token: survey.token,
        status: survey.status,
        createdAt: survey.createdAt,
        completedAt: survey.completedAt,
        user: {
          id: survey.userId || 0,
          username: survey.username || 'Paciente anónimo',
          email: survey.userEmail || 'Sin email'
        },
        service: {
          id: survey.serviceId,
          name: survey.serviceName || 'Servicio desconocido'
        },
        branch: {
          id: survey.branchId,
          name: survey.branchName || 'Sede desconocida'
        }
      }));

      res.json(formattedSurveys);

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener analytics y estadísticas de encuestas (admin/staff).
   * GET /api/surveys/all
   */
  app.get("/api/surveys/all", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { branchId, startDate, endDate } = req.query;
      
      let whereConditions = [];
      
      if (branchId) {
        whereConditions.push(eq(surveys.branchId, parseInt(branchId as string)));
      }
      
      if (startDate) {
        whereConditions.push(gte(surveys.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(surveys.createdAt, new Date(endDate as string)));
      }

      // Para staff, solo mostrar datos de su sede
      if (req.user.role === "staff" && req.user.branchId) {
        whereConditions.push(eq(surveys.branchId, req.user.branchId));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Estadísticas generales
      const totalSurveys = await db
        .select({ count: sql<number>`count(*)` })
        .from(surveys)
        .where(whereClause);

      const completedSurveys = await db
        .select({ count: sql<number>`count(*)` })
        .from(surveys)
        .where(and(eq(surveys.isCompleted, true), whereClause || undefined));

      const avgRating = await db
        .select({ avg: sql<number>`avg(${surveys.overallRating})` })
        .from(surveys)
        .where(and(
          eq(surveys.isCompleted, true),
          isNotNull(surveys.overallRating),
          whereClause || undefined
        ));

      // Distribución de ratings
      const ratingDistribution = await db
        .select({
          rating: surveys.overallRating,
          count: sql<number>`count(*)`
        })
        .from(surveys)
        .where(whereClause ? and(
          eq(surveys.isCompleted, true),
          isNotNull(surveys.overallRating),
          whereClause
        ) : and(
          eq(surveys.isCompleted, true),
          isNotNull(surveys.overallRating)
        ))
        .groupBy(surveys.overallRating)
        .orderBy(surveys.overallRating);

      // Encuestas por servicio
      const surveysByService = await db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          count: sql<number>`count(*)`,
          averageRating: sql<number>`avg(${surveys.overallRating})`
        })
        .from(surveys)
        .leftJoin(services, eq(surveys.serviceId, services.id))
        .where(whereClause)
        .groupBy(services.id, services.name)
        .orderBy(desc(sql<number>`count(*)`));

      // Encuestas por sede
      const surveysByBranch = await db
        .select({
          branchId: branches.id,
          branchName: branches.name,
          count: sql<number>`count(*)`,
          averageRating: sql<number>`avg(${surveys.overallRating})`
        })
        .from(surveys)
        .leftJoin(branches, eq(surveys.branchId, branches.id))
        .where(whereClause)
        .groupBy(branches.id, branches.name)
        .orderBy(desc(sql<number>`count(*)`));

      // Respuestas recientes
      const recentResponses = await db
        .select({
          id: surveyResponses.id,
          surveyId: surveyResponses.surveyId,
          questionId: surveyResponses.questionId,
          answer: surveyResponses.response,
          rating: surveyResponses.numericValue,
          createdAt: surveyResponses.createdAt,
          username: users.username,
          serviceName: services.name,
          question: surveyQuestions.question
        })
        .from(surveyResponses)
        .leftJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
        .leftJoin(users, eq(surveys.userId, users.id))
        .leftJoin(services, eq(surveys.serviceId, services.id))
        .leftJoin(surveyQuestions, eq(surveyResponses.questionId, surveyQuestions.id))
        .where(whereClause ? and(whereClause) : undefined)
        .orderBy(desc(surveyResponses.createdAt))
        .limit(20);

      // Transformar los datos para que coincidan con la estructura esperada por el frontend
      const formattedRecentResponses = recentResponses.map(response => ({
        id: response.id,
        surveyId: response.surveyId,
        questionId: response.questionId,
        answer: response.answer,
        rating: response.rating,
        createdAt: response.createdAt,
        survey: {
          user: {
            username: response.username || 'Usuario desconocido'
          },
          service: {
            name: response.serviceName || 'Servicio desconocido'
          }
        },
        question: {
          question: response.question || 'Pregunta desconocida'
        }
      }));

      res.json({
        totalSurveys: totalSurveys[0]?.count || 0,
        completedSurveys: completedSurveys[0]?.count || 0,
        pendingSurveys: (totalSurveys[0]?.count || 0) - (completedSurveys[0]?.count || 0),
        completionRate: totalSurveys[0]?.count ? 
          (completedSurveys[0]?.count / totalSurveys[0]?.count * 100) : 0,
        averageRating: avgRating[0]?.avg ? parseFloat(Number(avgRating[0].avg).toFixed(2)) : null,
        ratingDistribution,
        responsesByService: surveysByService,
        responsesByBranch: surveysByBranch,
        recentResponses: formattedRecentResponses
      });

    } catch (error) {
      next(error);
    }
  });

  // === ENDPOINTS PARA GESTIÓN DE PREGUNTAS DE ENCUESTAS ===

  /**
   * Obtener todas las preguntas de encuesta (admin/staff).
   * GET /api/survey-questions
   */
  app.get("/api/survey-questions", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { branchId } = req.query;
      
      let whereConditions = [];
      
      if (branchId) {
        whereConditions.push(eq(surveyQuestions.branchId, parseInt(branchId as string)));
      }

      // Para staff, solo mostrar preguntas de su sede
      if (req.user.role === "staff" && req.user.branchId) {
        whereConditions.push(eq(surveyQuestions.branchId, req.user.branchId));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const questions = await db
        .select({
          id: surveyQuestions.id,
          question: surveyQuestions.question,
          type: surveyQuestions.type,
          options: surveyQuestions.options,
          required: surveyQuestions.isRequired,
          order: surveyQuestions.order,
          isActive: surveyQuestions.isActive,
          branchId: surveyQuestions.branchId,
          createdAt: surveyQuestions.createdAt,
          updatedAt: surveyQuestions.createdAt // Usamos createdAt como fallback
        })
        .from(surveyQuestions)
        .where(whereClause)
        .orderBy(surveyQuestions.order, surveyQuestions.id);

      res.json(questions);

    } catch (error) {
      next(error);
    }
  });

  /**
   * Crear una nueva pregunta de encuesta (admin/staff).
   * POST /api/survey-questions
   */
  app.post("/api/survey-questions", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { question, type, options, required, order, branchId } = req.body;

      if (!question || !type || !branchId) {
        return res.status(400).json({ message: "question, type y branchId son requeridos" });
      }

      // Validar tipo de pregunta
      const validTypes = ["rating", "multiple_choice", "text", "yes_no", "nps"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Tipo de pregunta inválido" });
      }

      // Para staff, verificar que la sede sea la suya
      if (req.user.role === "staff" && req.user.branchId && branchId !== req.user.branchId) {
        return res.status(403).json({ message: "No puede crear preguntas para otras sedes" });
      }

      // Verificar que la sede existe
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch) {
        return res.status(404).json({ message: "Sede no encontrada" });
      }

      // Si no se proporciona order, obtener el siguiente disponible para la sede
      let finalOrder = order;
      if (!finalOrder) {
        const [lastQuestion] = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${surveyQuestions.order}), 0)` })
          .from(surveyQuestions)
          .where(eq(surveyQuestions.branchId, branchId));

        finalOrder = (lastQuestion?.maxOrder || 0) + 1;
      }

      const [newQuestion] = await db
        .insert(surveyQuestions)
        .values({
          question,
          type,
          options: options || null,
          isRequired: required || true,
          order: finalOrder,
          isActive: true,
          branchId,
          category: "general"
        })
        .returning();

      // Formatear la respuesta para que coincida con la estructura esperada por el frontend
      const formattedQuestion = {
        id: newQuestion.id,
        question: newQuestion.question,
        type: newQuestion.type,
        options: newQuestion.options,
        required: newQuestion.isRequired,
        order: newQuestion.order,
        isActive: newQuestion.isActive,
        branchId: newQuestion.branchId,
        createdAt: newQuestion.createdAt,
        updatedAt: newQuestion.createdAt
      };

      res.status(201).json(formattedQuestion);

    } catch (error) {
      next(error);
    }
  });

  /**
   * Actualizar una pregunta de encuesta existente (admin/staff).
   * PUT /api/survey-questions/:id
   */
  app.put("/api/survey-questions/:id", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "ID de pregunta inválido" });
      }

      const { question, type, options, required, order, isActive } = req.body;

      // Verificar que la pregunta existe
      const [existingQuestion] = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.id, questionId))
        .limit(1);

      if (!existingQuestion) {
        return res.status(404).json({ message: "Pregunta no encontrada" });
      }

      // Para staff, verificar que la pregunta pertenece a su sede
      if (req.user.role === "staff" && req.user.branchId && existingQuestion.branchId !== req.user.branchId) {
        return res.status(403).json({ message: "No puede editar preguntas de otras sedes" });
      }

      // Validar tipo de pregunta si se proporciona
      if (type) {
        const validTypes = ["rating", "multiple_choice", "text", "yes_no", "nps"];
        if (!validTypes.includes(type)) {
          return res.status(400).json({ message: "Tipo de pregunta inválido" });
        }
      }

      // Preparar los datos de actualización
      const updateData: any = {};
      if (question !== undefined) updateData.question = question;
      if (type !== undefined) updateData.type = type;
      if (options !== undefined) updateData.options = options;
      if (required !== undefined) updateData.isRequired = required;
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;

      const [updatedQuestion] = await db
        .update(surveyQuestions)
        .set(updateData)
        .where(eq(surveyQuestions.id, questionId))
        .returning();

      // Formatear la respuesta
      const formattedQuestion = {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        type: updatedQuestion.type,
        options: updatedQuestion.options,
        required: updatedQuestion.isRequired,
        order: updatedQuestion.order,
        isActive: updatedQuestion.isActive,
        branchId: updatedQuestion.branchId,
        createdAt: updatedQuestion.createdAt,
        updatedAt: updatedQuestion.createdAt
      };

      res.json(formattedQuestion);

    } catch (error) {
      next(error);
    }
  });

  /**
   * Eliminar una pregunta de encuesta (admin/staff).
   * DELETE /api/survey-questions/:id
   */
  app.delete("/api/survey-questions/:id", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "ID de pregunta inválido" });
      }

      // Verificar que la pregunta existe
      const [existingQuestion] = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.id, questionId))
        .limit(1);

      if (!existingQuestion) {
        return res.status(404).json({ message: "Pregunta no encontrada" });
      }

      // Para staff, verificar que la pregunta pertenece a su sede
      if (req.user.role === "staff" && req.user.branchId && existingQuestion.branchId !== req.user.branchId) {
        return res.status(403).json({ message: "No puede eliminar preguntas de otras sedes" });
      }

      // Verificar si la pregunta tiene respuestas asociadas
      const [responseCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(surveyResponses)
        .where(eq(surveyResponses.questionId, questionId));

      if (responseCount.count > 0) {
        // Si tiene respuestas, desactivar en lugar de eliminar
        await db
          .update(surveyQuestions)
          .set({ isActive: false })
          .where(eq(surveyQuestions.id, questionId));

        res.json({ 
          message: "Pregunta desactivada (tiene respuestas asociadas)",
          deactivated: true 
        });
      } else {
        // Si no tiene respuestas, eliminar físicamente
        await db
          .delete(surveyQuestions)
          .where(eq(surveyQuestions.id, questionId));

        res.json({ 
          message: "Pregunta eliminada exitosamente",
          deleted: true 
        });
      }

    } catch (error) {
      next(error);
    }
  });

  /**
   * Reenviar email de encuesta específica (admin/staff).
   * POST /api/surveys/:id/resend-email
   */
  app.post("/api/surveys/:id/resend-email", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({ message: "ID de encuesta inválido" });
      }

      // Obtener información de la encuesta
      const [survey] = await db
        .select({
          id: surveys.id,
          token: surveys.surveyToken,
          emailAddress: surveys.emailAddress,
          patientName: surveys.patientName,
          branchId: surveys.branchId,
          serviceId: surveys.serviceId,
          isCompleted: surveys.isCompleted,
          userId: surveys.userId,
          userEmail: users.email,
          userName: users.username,
          serviceName: services.name,
          branchName: branches.name
        })
        .from(surveys)
        .leftJoin(users, eq(surveys.userId, users.id))
        .leftJoin(services, eq(surveys.serviceId, services.id))
        .leftJoin(branches, eq(surveys.branchId, branches.id))
        .where(eq(surveys.id, surveyId))
        .limit(1);

      if (!survey) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }

      // Verificar que la encuesta no esté completada
      if (survey.isCompleted) {
        return res.status(400).json({ message: "No se puede reenviar email para encuestas completadas" });
      }

      // Para staff, verificar que la encuesta pertenece a su sede
      if (req.user.role === "staff" && req.user.branchId && survey.branchId !== req.user.branchId) {
        return res.status(403).json({ message: "No tiene permisos para esta encuesta" });
      }

      const recipientEmail = survey.userEmail || survey.emailAddress;
      const recipientName = survey.userName || survey.patientName || 'Cliente';

      if (!recipientEmail) {
        return res.status(400).json({ message: "No hay email asociado a esta encuesta" });
      }

      // URL de la encuesta
      const surveyUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/survey/${survey.token}`;

      // Construir el asunto y contenido del email
      const subject = `[${survey.branchName}] Encuesta de Satisfacción - ${survey.serviceName}`;
      const text = `
Estimado/a ${recipientName},

Le invitamos a completar nuestra encuesta de satisfacción sobre el servicio "${survey.serviceName}" que recibió en ${survey.branchName}.

Su opinión es muy importante para nosotros y nos ayuda a mejorar continuamente nuestros servicios.

Para acceder a la encuesta, haga clic en el siguiente enlace:
${surveyUrl}

La encuesta tomará solo unos minutos y es completamente anónima.

Gracias por su tiempo y confianza.

Atentamente,
El equipo de ${survey.branchName}
      `.trim();

      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Encuesta de Satisfacción</h2>
            <p><strong>Servicio:</strong> ${survey.serviceName}</p>
            <p><strong>Sede:</strong> ${survey.branchName}</p>
        </div>
        
        <p>Estimado/a <strong>${recipientName}</strong>,</p>
        
        <p>Le invitamos a completar nuestra encuesta de satisfacción sobre el servicio que recibió. Su opinión es muy importante para nosotros y nos ayuda a mejorar continuamente nuestros servicios.</p>
        
        <div style="text-align: center;">
            <a href="${surveyUrl}" class="button">Completar Encuesta</a>
        </div>
        
        <p>La encuesta tomará solo unos minutos y es completamente anónima.</p>
        
        <p>Si el botón no funciona, puede copiar y pegar este enlace en su navegador:<br>
        <a href="${surveyUrl}">${surveyUrl}</a></p>
        
        <div class="footer">
            <p>Gracias por su tiempo y confianza.</p>
            <p><strong>El equipo de ${survey.branchName}</strong></p>
        </div>
    </div>
</body>
</html>
      `.trim();

      // Enviar el email usando el emailService
      await emailService.sendSurveyEmail({
        email: recipientEmail,
        patientName: recipientName,
        token: survey.token,
        serviceName: survey.serviceName || 'Servicio',
        branchName: survey.branchName || 'Nuestra sede'
      });

      // Actualizar el timestamp de último envío
      await db
        .update(surveys)
        .set({ 
          emailSentAt: new Date(),
          emailSent: true 
        })
        .where(eq(surveys.id, surveyId));

      res.json({ 
        message: "Email reenviado exitosamente",
        emailSent: true,
        sentTo: recipientEmail 
      });

    } catch (error) {
      console.error('Error resending survey email:', error);
      next(error);
    }
  });

  // === ENDPOINTS PARA GESTIÓN DEL SISTEMA DE "NO ASISTIÓ" ===

  /**
   * Obtener estadísticas del scheduler de no asistió (admin/staff).
   * GET /api/no-show/stats
   */
  app.get("/api/no-show/stats", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { noShowScheduler } = await import("./services/no-show-scheduler");
      const stats = noShowScheduler.getStats();
      const config = noShowScheduler.getConfig();

      res.json({
        stats,
        config,
        message: "Estadísticas obtenidas exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Actualizar configuración del scheduler de no asistió (admin).
   * PUT /api/no-show/config
   */
  app.put("/api/no-show/config", async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo administradores" });
      }

      const { intervalMinutes, enabled, graceTimeMinutes } = req.body;

      // Validar datos de entrada
      if (intervalMinutes && (intervalMinutes < 5 || intervalMinutes > 1440)) {
        return res.status(400).json({ 
          message: "El intervalo debe estar entre 5 y 1440 minutos" 
        });
      }

      if (graceTimeMinutes && (graceTimeMinutes < 0 || graceTimeMinutes > 1440)) {
        return res.status(400).json({ 
          message: "El tiempo de gracia debe estar entre 0 y 1440 minutos" 
        });
      }

      const { noShowScheduler } = await import("./services/no-show-scheduler");
      
      const newConfig = {
        ...(intervalMinutes !== undefined && { intervalMinutes }),
        ...(enabled !== undefined && { enabled }),
        ...(graceTimeMinutes !== undefined && { graceTimeMinutes })
      };

      noShowScheduler.updateConfig(newConfig);
      const updatedConfig = noShowScheduler.getConfig();

      res.json({
        config: updatedConfig,
        message: "Configuración actualizada exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Ejecutar manualmente el marcado de no asistió (admin/staff).
   * POST /api/no-show/execute
   */
  app.post("/api/no-show/execute", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { noShowScheduler } = await import("./services/no-show-scheduler");
      
      // Ejecutar el procesamiento manualmente
      await noShowScheduler.executeManually();
      
      const stats = noShowScheduler.getStats();

      res.json({
        stats,
        message: "Procesamiento manual ejecutado exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Marcar manualmente una cita como no asistió (admin/staff).
   * POST /api/appointments/:id/mark-no-show
   */
  app.post("/api/appointments/:id/mark-no-show", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const appointmentId = parseInt(req.params.id);
      const { reason } = req.body;

      // Buscar la cita
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Validar que staff solo gestione citas de su sede
      if (req.user.role === 'staff' && req.user.branchId && appointment.branchId !== req.user.branchId) {
        return res.status(403).json({ 
          message: "No autorizado para gestionar citas de otras sedes" 
        });
      }

      // Validar que la cita pueda marcarse como no asistió
      if (appointment.status === "no-show") {
        return res.status(400).json({ message: "La cita ya está marcada como no asistió" });
      }

      if (appointment.status === "checked-in") {
        return res.status(400).json({ message: "No se puede marcar como no asistió una cita con check-in" });
      }

      if (appointment.status === "completed") {
        return res.status(400).json({ message: "No se puede marcar como no asistió una cita completada" });
      }

      if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "No se puede marcar como no asistió una cita cancelada" });
      }

      // Marcar la cita como no asistió
      const now = new Date();
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          status: 'no-show',
          noShowMarkedAt: now,
          autoMarkedAsNoShow: false, // Marcado manualmente
          updatedAt: now
        })
        .where(eq(appointments.id, appointmentId))
        .returning();

      res.json({
        appointment: updatedAppointment,
        message: "Cita marcada como no asistió exitosamente",
        reason: reason || null
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener reporte de citas marcadas como no asistió (admin/staff).
   * GET /api/no-show/report
   */
  app.get("/api/no-show/report", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { startDate, endDate, branchId, autoMarked } = req.query;
      
      let whereConditions = [eq(appointments.status, 'no-show')];
      
      if (startDate) {
        whereConditions.push(gte(appointments.noShowMarkedAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(appointments.noShowMarkedAt, new Date(endDate as string)));
      }

      if (branchId) {
        whereConditions.push(eq(appointments.branchId, parseInt(branchId as string)));
      }

      if (autoMarked !== undefined) {
        whereConditions.push(eq(appointments.autoMarkedAsNoShow, autoMarked === 'true'));
      }

      // Para staff, solo mostrar datos de su sede
      if (req.user.role === "staff" && req.user.branchId) {
        whereConditions.push(eq(appointments.branchId, req.user.branchId));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Obtener citas marcadas como no asistió
      const noShowAppointments = await db
        .select({
          id: appointments.id,
          confirmationCode: appointments.confirmationCode,
          scheduledAt: appointments.scheduledAt,
          noShowMarkedAt: appointments.noShowMarkedAt,
          autoMarkedAsNoShow: appointments.autoMarkedAsNoShow,
          guestName: appointments.guestName,
          guestEmail: appointments.guestEmail,
          serviceName: services.name,
          branchName: branches.name,
          username: users.username,
          userEmail: users.email
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .leftJoin(branches, eq(appointments.branchId, branches.id))
        .leftJoin(users, eq(appointments.userId, users.id))
        .where(whereClause)
        .orderBy(desc(appointments.noShowMarkedAt));

      res.json({
        appointments: noShowAppointments,
        total: noShowAppointments.length,
        message: "Reporte generado exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  // === CONFIGURACIÓN DE PARÁMETROS POR SEDE ===

  /**
   * GET /api/branches/:branchId/settings
   * Obtener la configuración de una sede específica
   */
  app.get("/api/branches/:branchId/settings", async (req, res, next) => {
    try {
      // Verificar autenticación
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      // Solo admin o staff de la sede pueden ver la configuración
      const branchId = parseInt(req.params.branchId);
      if (req.user.role !== "admin" && (req.user.role !== "staff" || req.user.branchId !== branchId)) {
        return res.status(403).json({ message: "No autorizado para ver esta configuración" });
      }

      // Buscar configuración existente
      const settings = await BranchSettingsService.getBranchSettings(branchId);

      res.json({
        settings: settings,
        isDefault: settings.id === 0
      });

    } catch (error) {
      console.error('Error fetching branch settings:', error);
      next(error);
    }
  });

  /**
   * POST /api/branches/:branchId/settings
   * Crear configuración inicial para una sede
   */
  app.post("/api/branches/:branchId/settings", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Solo los administradores pueden crear configuraciones" });
      }

      const branchId = parseInt(req.params.branchId);
      
      // Validar datos de entrada
      try {
        const validatedData = BranchSettingsFormSchema.parse({
          ...req.body,
          branchId: branchId
        });
        
        // Verificar que la sede existe
        const [branch] = await db
          .select()
          .from(branches)
          .where(eq(branches.id, branchId))
          .limit(1);

        if (!branch) {
          return res.status(404).json({ message: "Sede no encontrada" });
        }

        // Verificar que no exista ya una configuración
        const [existingSettings] = await db
          .select()
          .from(branchSettings)
          .where(eq(branchSettings.branchId, branchId))
          .limit(1);

        if (existingSettings) {
          return res.status(409).json({ message: "Ya existe una configuración para esta sede" });
        }

        // Crear nueva configuración con datos validados
        const newSettings = {
          branchId: branchId,
          settings: validatedData.settings,
          cancellationHours: validatedData.cancellationHours,
          rescheduleTimeLimit: validatedData.rescheduleTimeLimit,
          maxAdvanceBookingDays: validatedData.maxAdvanceBookingDays,
          remindersEnabled: validatedData.remindersEnabled,
          reminderHours: validatedData.reminderHours || 24,
          reminderMessage: validatedData.reminderMessage || null,
          emergencyMode: validatedData.emergencyMode,
          isActive: validatedData.isActive,
          createdBy: req.user.id,
          updatedBy: req.user.id
        };

        const [created] = await db
          .insert(branchSettings)
          .values(newSettings)
          .returning();

        res.status(201).json({
          message: "Configuración creada exitosamente",
          settings: created
        });

      } catch (validationError: any) {
        if (validationError.name === 'ZodError') {
          return res.status(400).json({
            message: "Datos de configuración inválidos",
            errors: validationError.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        throw validationError;
      }

    } catch (error) {
      console.error('Error creating branch settings:', error);
      next(error);
    }
  });

  /**
   * PUT /api/branches/:branchId/settings
   * Actualizar configuración de una sede
   */
  app.put("/api/branches/:branchId/settings", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const branchId = parseInt(req.params.branchId);
      
      // Solo admin o staff de la sede pueden actualizar la configuración
      if (req.user.role !== "admin" && (req.user.role !== "staff" || req.user.branchId !== branchId)) {
        return res.status(403).json({ message: "No autorizado para modificar esta configuración" });
      }

      // Validar datos de entrada
      try {
        const validatedData = PartialBranchSettingsSchema.parse(req.body);

        // Verificar que la configuración existe
        const [existingSettings] = await db
          .select()
          .from(branchSettings)
          .where(eq(branchSettings.branchId, branchId))
          .limit(1);

        if (!existingSettings) {
          return res.status(404).json({ message: "Configuración no encontrada" });
        }

        // Preparar datos de actualización con valores validados
        const updateData = {
          settings: validatedData.settings !== undefined ? validatedData.settings : existingSettings.settings,
          cancellationHours: validatedData.cancellationHours !== undefined ? validatedData.cancellationHours : existingSettings.cancellationHours,
          rescheduleTimeLimit: validatedData.rescheduleTimeLimit !== undefined ? validatedData.rescheduleTimeLimit : existingSettings.rescheduleTimeLimit,
          maxAdvanceBookingDays: validatedData.maxAdvanceBookingDays !== undefined ? validatedData.maxAdvanceBookingDays : existingSettings.maxAdvanceBookingDays,
          remindersEnabled: validatedData.remindersEnabled !== undefined ? validatedData.remindersEnabled : existingSettings.remindersEnabled,
          reminderHours: validatedData.reminderHours !== undefined ? validatedData.reminderHours : existingSettings.reminderHours,
          reminderMessage: validatedData.reminderMessage !== undefined ? validatedData.reminderMessage : existingSettings.reminderMessage,
          emergencyMode: validatedData.emergencyMode !== undefined ? validatedData.emergencyMode : existingSettings.emergencyMode,
          isActive: validatedData.isActive !== undefined ? validatedData.isActive : existingSettings.isActive,
          version: existingSettings.version + 1,
          updatedAt: new Date(),
          updatedBy: req.user.id
        };

        const [updated] = await db
          .update(branchSettings)
          .set(updateData)
          .where(eq(branchSettings.branchId, branchId))
          .returning();

        res.json({
          message: "Configuración actualizada exitosamente",
          settings: updated
        });

      } catch (validationError: any) {
        if (validationError.name === 'ZodError') {
          console.error('Zod validation error details (PUT):', validationError.errors);
          console.error('Data being validated (PUT):', req.body);
          return res.status(400).json({
            message: "Datos de configuración inválidos",
            errors: validationError.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
              received: err.received
            }))
          });
        }
        throw validationError;
      }

    } catch (error) {
      console.error('Error updating branch settings:', error);
      next(error);
    }
  });

  /**
   * DELETE /api/branches/:branchId/settings
   * Eliminar configuración de una sede (restaurar valores por defecto)
   */
  app.delete("/api/branches/:branchId/settings", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Solo los administradores pueden eliminar configuraciones" });
      }

      const branchId = parseInt(req.params.branchId);

      // Verificar que la configuración existe
      const [existingSettings] = await db
        .select()
        .from(branchSettings)
        .where(eq(branchSettings.branchId, branchId))
        .limit(1);

      if (!existingSettings) {
        return res.status(404).json({ message: "Configuración no encontrada" });
      }

      // Eliminar la configuración
      await db
        .delete(branchSettings)
        .where(eq(branchSettings.branchId, branchId));

      res.json({
        message: "Configuración eliminada exitosamente",
        note: "La sede volverá a usar los valores por defecto del sistema"
      });

    } catch (error) {
      console.error('Error deleting branch settings:', error);
      next(error);
    }
  });

  /**
   * GET /api/branches/:branchId/settings/history
   * Obtener historial de cambios de configuración de una sede
   */
  app.get("/api/branches/:branchId/settings/history", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Solo los administradores pueden ver el historial" });
      }

      const branchId = parseInt(req.params.branchId);

      // Obtener configuración actual con información de usuarios
      const settingsHistory = await db
        .select({
          id: branchSettings.id,
          version: branchSettings.version,
          settings: branchSettings.settings,
          cancellationHours: branchSettings.cancellationHours,
          rescheduleTimeLimit: branchSettings.rescheduleTimeLimit,
          maxAdvanceBookingDays: branchSettings.maxAdvanceBookingDays,
          remindersEnabled: branchSettings.remindersEnabled,
          emergencyMode: branchSettings.emergencyMode,
          isActive: branchSettings.isActive,
          createdAt: branchSettings.createdAt,
          updatedAt: branchSettings.updatedAt,
          createdByUser: {
            id: users.id,
            username: users.username,
            email: users.email
          },
          updatedByUser: {
            id: users.id,
            username: users.username,
            email: users.email
          }
        })
        .from(branchSettings)
        .leftJoin(users, eq(branchSettings.createdBy, users.id))
        .leftJoin(users, eq(branchSettings.updatedBy, users.id))
        .where(eq(branchSettings.branchId, branchId))
        .orderBy(desc(branchSettings.version));

      res.json({
        branchId: branchId,
        history: settingsHistory
      });

    } catch (error) {
      console.error('Error fetching branch settings history:', error);
      next(error);
    }
  });

  /**
   * POST /api/branches/:branchId/settings/emergency-mode
   * Activar/desactivar modo de emergencia rápidamente
   */
  app.post("/api/branches/:branchId/settings/emergency-mode", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const branchId = parseInt(req.params.branchId);
      
      // Validar datos de entrada
      try {
        const { enabled, reason } = EmergencyModeToggleSchema.parse(req.body);

        // Solo admin o staff de la sede pueden cambiar el modo de emergencia
        if (req.user.role !== "admin" && (req.user.role !== "staff" || req.user.branchId !== branchId)) {
          return res.status(403).json({ message: "No autorizado para modificar el modo de emergencia" });
        }

        // Usar el servicio para cambiar el modo de emergencia
        await BranchSettingsService.toggleEmergencyMode(branchId, enabled, req.user.id);

        // Obtener configuración actualizada
        const updatedSettings = await BranchSettingsService.getBranchSettings(branchId);

        // Log del cambio de modo de emergencia
        console.log(`Emergency mode ${enabled ? 'activated' : 'deactivated'} for branch ${branchId} by user ${req.user.username}. Reason: ${reason || 'No reason provided'}`);

        res.json({
          message: `Modo de emergencia ${enabled ? 'activado' : 'desactivado'} exitosamente`,
          emergencyMode: enabled,
          settings: updatedSettings,
          changedBy: req.user.username,
          changedAt: new Date(),
          reason: reason || null
        });

      } catch (validationError: any) {
        if (validationError.name === 'ZodError') {
          return res.status(400).json({
            message: "Datos inválidos para cambiar modo de emergencia",
            errors: validationError.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        throw validationError;
      }

    } catch (error) {
      console.error('Error changing emergency mode:', error);
      next(error);
    }
  });

  /**
   * GET /api/settings/branches/summary
   * Obtener resumen de configuraciones de todas las sedes (solo admin)
   */
  app.get("/api/settings/branches/summary", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Solo los administradores pueden ver el resumen" });
      }

      // Obtener todas las sedes con sus configuraciones
      const branchesWithSettings = await db
        .select({
          branchId: branches.id,
          branchName: branches.name,
          branchIsActive: branches.isActive,
          settingsId: branchSettings.id,
          cancellationHours: branchSettings.cancellationHours,
          rescheduleTimeLimit: branchSettings.rescheduleTimeLimit,
          maxAdvanceBookingDays: branchSettings.maxAdvanceBookingDays,
          remindersEnabled: branchSettings.remindersEnabled,
          emergencyMode: branchSettings.emergencyMode,
          settingsIsActive: branchSettings.isActive,
          settingsVersion: branchSettings.version,
          lastUpdated: branchSettings.updatedAt
        })
        .from(branches)
        .leftJoin(branchSettings, eq(branches.id, branchSettings.branchId))
        .where(eq(branches.isActive, true))
        .orderBy(branches.name);

      const summary = branchesWithSettings.map(branch => ({
        branchId: branch.branchId,
        branchName: branch.branchName,
        hasCustomSettings: !!branch.settingsId,
        isEmergencyMode: branch.emergencyMode || false,
        configuration: branch.settingsId ? {
          cancellationHours: branch.cancellationHours,
          rescheduleTimeLimit: branch.rescheduleTimeLimit,
          maxAdvanceBookingDays: branch.maxAdvanceBookingDays,
          remindersEnabled: branch.remindersEnabled,
          version: branch.settingsVersion,
          lastUpdated: branch.lastUpdated
        } : {
          // Valores por defecto
          cancellationHours: 24,
          rescheduleTimeLimit: 4,
          maxAdvanceBookingDays: 30,
          remindersEnabled: true,
          version: 0,
          lastUpdated: null
        }
      }));

      const stats = {
        totalBranches: branchesWithSettings.length,
        branchesWithCustomSettings: branchesWithSettings.filter(b => b.settingsId).length,
        branchesInEmergencyMode: branchesWithSettings.filter(b => b.emergencyMode).length
      };

      res.json({
        summary: summary,
        statistics: stats
      });

    } catch (error) {
      console.error('Error fetching branches settings summary:', error);
      next(error);
    }
  });

  // === FUNCIONES AUXILIARES ===
  
  /**
   * Obtener configuración de una sede (con valores por defecto si no existe)
   */
  async function getBranchSettings(branchId: number) {
    const [settings] = await db
      .select()
      .from(branchSettings)
      .where(eq(branchSettings.branchId, branchId))
      .limit(1);

    if (!settings) {
      // Retornar configuración por defecto
      return {
        id: 0,
        branchId: branchId,
        settings: {},
        version: 1,
        cancellationHours: 24,
        rescheduleTimeLimit: 4,
        maxAdvanceBookingDays: 30,
        remindersEnabled: true,
        emergencyMode: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null
      };
    }

    return settings;
  }

  /**
   * Verificar si una sede está en modo de emergencia
   */
  async function isBranchInEmergencyMode(branchId: number): Promise<boolean> {
    const settings = await getBranchSettings(branchId);
    return settings.emergencyMode;
  }

  /**
   * Obtener horas de cancelación permitidas para una sede
   */
  async function getBranchCancellationHours(branchId: number): Promise<number> {
    const settings = await getBranchSettings(branchId);
    return settings.cancellationHours;
  }

  /**
   * Obtener límite de tiempo para reagendamiento de una sede
   */
  async function getBranchRescheduleTimeLimit(branchId: number): Promise<number> {
    const settings = await getBranchSettings(branchId);
    return settings.rescheduleTimeLimit;
  }

  /**
   * Verificar si los recordatorios están habilitados para una sede
   */
  async function areBranchRemindersEnabled(branchId: number): Promise<boolean> {
    const settings = await getBranchSettings(branchId);
    return settings.remindersEnabled;
  }

  /**
   * Obtener nombre del servicio por ID
   */
  async function getServiceName(serviceId: number): Promise<string> {
    const [service] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);
    
    return service?.name || 'Servicio no encontrado';
  }

  /**
   * Obtener nombre de la sede por ID
   */
  async function getBranchName(branchId: number): Promise<string> {
    const [branch] = await db
      .select({ name: branches.name })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);
    
    return branch?.name || 'Sede no encontrada';
  }

  // =========================================================================
  // UTILITIES PARA REPORTES DE TIEMPOS DE ESPERA
  // =========================================================================

  /**
   * Valida y construye filtros para reportes de tiempos de espera
   */
  function validateAndBuildFilters(req: any): { success: boolean; error?: string; filters?: any } {
    // Validar parámetros requeridos
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return {
        success: false,
        error: "Los parámetros startDate y endDate son requeridos"
      };
    }

    // Validar formato de fechas
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        error: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DD)"
      };
    }

    if (start >= end) {
      return {
        success: false,
        error: "La fecha de inicio debe ser anterior a la fecha de fin"
      };
    }

    // Validar rango de fechas (máximo 1 año)
    const maxRange = 365 * 24 * 60 * 60 * 1000;
    if ((end.getTime() - start.getTime()) > maxRange) {
      return {
        success: false,
        error: "El rango de fechas no puede ser mayor a 1 año"
      };
    }

    // Construir filtros
    const filters: any = {
      dateRange: { startDate: start, endDate: end }
    };

    // Aplicar filtros opcionales
    if (req.query.branchId) {
      const branchId = parseInt(req.query.branchId as string);
      if (isNaN(branchId)) {
        return {
          success: false,
          error: "branchId debe ser un número válido"
        };
      }
      filters.branchId = branchId;
    }

    if (req.query.serviceId) {
      const serviceId = parseInt(req.query.serviceId as string);
      if (isNaN(serviceId)) {
        return {
          success: false,
          error: "serviceId debe ser un número válido"
        };
      }
      filters.serviceId = serviceId;
    }

    if (req.query.servicePointId) {
      const servicePointId = parseInt(req.query.servicePointId as string);
      if (isNaN(servicePointId)) {
        return {
          success: false,
          error: "servicePointId debe ser un número válido"
        };
      }
      filters.servicePointId = servicePointId;
    }

    // Si el usuario es staff, solo puede ver datos de su sede
    if (req.user?.role === 'staff' && req.user?.branchId) {
      filters.branchId = req.user.branchId;
    }

    return { success: true, filters };
  }

  /**
   * Verifica permisos para reportes de tiempos de espera
   */
  function checkReportPermissions(req: any): { success: boolean; error?: string } {
    if (!req.user) {
      return {
        success: false,
        error: "Usuario no autenticado"
      };
    }

    if (!['admin', 'staff'].includes(req.user.role)) {
      return {
        success: false,
        error: "No autorizado para ver reportes"
      };
    }

    return { success: true };
  }

  // =========================================================================
  // ENDPOINTS DE REPORTES DE TIEMPOS DE ESPERA
  // =========================================================================

  /**
   * Obtener reporte de tiempos de espera por sede
   * GET /api/reports/wait-times/by-branch
   * 
   * Query parameters:
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   * - branchId?: number (opcional, filtrar por sede específica)
   * - serviceId?: number (opcional, filtrar por servicio específico)
   * - servicePointId?: number (opcional, filtrar por punto de atención específico)
   */
  app.get("/api/reports/wait-times/by-branch", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar y construir filtros
      const filterValidation = validateAndBuildFilters(req);
      if (!filterValidation.success) {
        return res.status(400).json({
          message: filterValidation.error
        });
      }

      const filters = filterValidation.filters!;

      // Obtener datos del reporte
      const report = await waitTimeAnalyticsService.getWaitTimesByBranch(filters);

      res.json({
        success: true,
        data: report,
        filters: {
          dateRange: { 
            startDate: filters.dateRange.startDate.toISOString(), 
            endDate: filters.dateRange.endDate.toISOString() 
          },
          branchId: filters.branchId || null,
          serviceId: filters.serviceId || null,
          servicePointId: filters.servicePointId || null
        },
        metadata: {
          totalBranches: report.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generando reporte por sede:', error);
      next(error);
    }
  });

  /**
   * Obtener reporte de tiempos de espera por servicio
   * GET /api/reports/wait-times/by-service
   */
  app.get("/api/reports/wait-times/by-service", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({
          message: "Usuario no autenticado"
        });
      }

      if (!['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({
          message: "No autorizado para ver reportes"
        });
      }

      // Validar parámetros requeridos
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      // Validar formato de fechas
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DD)"
        });
      }

      if (start >= end) {
        return res.status(400).json({
          message: "La fecha de inicio debe ser anterior a la fecha de fin"
        });
      }

      // Validar rango de fechas (máximo 1 año)
      const maxRange = 365 * 24 * 60 * 60 * 1000;
      if ((end.getTime() - start.getTime()) > maxRange) {
        return res.status(400).json({
          message: "El rango de fechas no puede ser mayor a 1 año"
        });
      }

      // Construir filtros
      const filters: any = {
        dateRange: { startDate: start, endDate: end }
      };

      // Aplicar filtros opcionales
      if (req.query.branchId) {
        const branchId = parseInt(req.query.branchId as string);
        if (isNaN(branchId)) {
          return res.status(400).json({
            message: "branchId debe ser un número válido"
          });
        }
        filters.branchId = branchId;
      }

      if (req.query.serviceId) {
        const serviceId = parseInt(req.query.serviceId as string);
        if (isNaN(serviceId)) {
          return res.status(400).json({
            message: "serviceId debe ser un número válido"
          });
        }
        filters.serviceId = serviceId;
      }

      if (req.query.servicePointId) {
        const servicePointId = parseInt(req.query.servicePointId as string);
        if (isNaN(servicePointId)) {
          return res.status(400).json({
            message: "servicePointId debe ser un número válido"
          });
        }
        filters.servicePointId = servicePointId;
      }

      // Si el usuario es staff, solo puede ver datos de su sede
      if (req.user.role === 'staff' && req.user.branchId) {
        filters.branchId = req.user.branchId;
      }

      // Obtener datos del reporte
      const report = await waitTimeAnalyticsService.getWaitTimesByService(filters);

      res.json({
        success: true,
        data: report,
        filters: {
          dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
          branchId: filters.branchId || null,
          serviceId: filters.serviceId || null,
          servicePointId: filters.servicePointId || null
        },
        metadata: {
          totalServices: report.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generando reporte por servicio:', error);
      next(error);
    }
  });

  /**
   * Obtener reporte de tiempos de espera por punto de atención
   * GET /api/reports/wait-times/by-service-point
   */
  app.get("/api/reports/wait-times/by-service-point", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({
          message: "Usuario no autenticado"
        });
      }

      if (!['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({
          message: "No autorizado para ver reportes"
        });
      }

      // Validar parámetros requeridos
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      // Validar formato de fechas
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DD)"
        });
      }

      if (start >= end) {
        return res.status(400).json({
          message: "La fecha de inicio debe ser anterior a la fecha de fin"
        });
      }

      // Validar rango de fechas (máximo 1 año)
      const maxRange = 365 * 24 * 60 * 60 * 1000;
      if ((end.getTime() - start.getTime()) > maxRange) {
        return res.status(400).json({
          message: "El rango de fechas no puede ser mayor a 1 año"
        });
      }

      // Construir filtros
      const filters: any = {
        dateRange: { startDate: start, endDate: end }
      };

      // Aplicar filtros opcionales
      if (req.query.branchId) {
        const branchId = parseInt(req.query.branchId as string);
        if (isNaN(branchId)) {
          return res.status(400).json({
            message: "branchId debe ser un número válido"
          });
        }
        filters.branchId = branchId;
      }

      if (req.query.serviceId) {
        const serviceId = parseInt(req.query.serviceId as string);
        if (isNaN(serviceId)) {
          return res.status(400).json({
            message: "serviceId debe ser un número válido"
          });
        }
        filters.serviceId = serviceId;
      }

      if (req.query.servicePointId) {
        const servicePointId = parseInt(req.query.servicePointId as string);
        if (isNaN(servicePointId)) {
          return res.status(400).json({
            message: "servicePointId debe ser un número válido"
          });
        }
        filters.servicePointId = servicePointId;
      }

      // Si el usuario es staff, solo puede ver datos de su sede
      if (req.user.role === 'staff' && req.user.branchId) {
        filters.branchId = req.user.branchId;
      }

      // Obtener datos del reporte
      const report = await waitTimeAnalyticsService.getWaitTimesByServicePoint(filters);

      res.json({
        success: true,
        data: report,
        filters: {
          dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
          branchId: filters.branchId || null,
          serviceId: filters.serviceId || null,
          servicePointId: filters.servicePointId || null
        },
        metadata: {
          totalServicePoints: report.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generando reporte por punto de atención:', error);
      next(error);
    }
  });

  /**
   * Obtener resumen general de tiempos de espera
   * GET /api/reports/wait-times/summary
   */
  app.get("/api/reports/wait-times/summary", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({
          message: "Usuario no autenticado"
        });
      }

      if (!['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({
          message: "No autorizado para ver reportes"
        });
      }

      // Validar parámetros requeridos
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      // Validar formato de fechas
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DD)"
        });
      }

      if (start >= end) {
        return res.status(400).json({
          message: "La fecha de inicio debe ser anterior a la fecha de fin"
        });
      }

      // Validar rango de fechas (máximo 1 año)
      const maxRange = 365 * 24 * 60 * 60 * 1000;
      if ((end.getTime() - start.getTime()) > maxRange) {
        return res.status(400).json({
          message: "El rango de fechas no puede ser mayor a 1 año"
        });
      }

      // Construir filtros
      const filters: any = {
        dateRange: { startDate: start, endDate: end }
      };

      // Aplicar filtros opcionales
      if (req.query.branchId) {
        const branchId = parseInt(req.query.branchId as string);
        if (isNaN(branchId)) {
          return res.status(400).json({
            message: "branchId debe ser un número válido"
          });
        }
        filters.branchId = branchId;
      }

      if (req.query.serviceId) {
        const serviceId = parseInt(req.query.serviceId as string);
        if (isNaN(serviceId)) {
          return res.status(400).json({
            message: "serviceId debe ser un número válido"
          });
        }
        filters.serviceId = serviceId;
      }

      if (req.query.servicePointId) {
        const servicePointId = parseInt(req.query.servicePointId as string);
        if (isNaN(servicePointId)) {
          return res.status(400).json({
            message: "servicePointId debe ser un número válido"
          });
        }
        filters.servicePointId = servicePointId;
      }

      // Si el usuario es staff, solo puede ver datos de su sede
      if (req.user.role === 'staff' && req.user.branchId) {
        filters.branchId = req.user.branchId;
      }

      // Obtener datos del reporte
      const summary = await waitTimeAnalyticsService.getWaitTimesSummary(filters);

      res.json({
        success: true,
        data: summary,
        filters: {
          dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
          branchId: filters.branchId || null,
          serviceId: filters.serviceId || null,
          servicePointId: filters.servicePointId || null
        },
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generando resumen de tiempos de espera:', error);
      next(error);
    }
  });

  /**
   * Endpoint combinado para obtener todos los reportes de tiempos de espera
   * GET /api/reports/wait-times/complete
   * 
   * Devuelve un objeto con todos los tipos de reportes:
   * - byBranch: reportes por sede
   * - byService: reportes por servicio  
   * - byServicePoint: reportes por punto de atención
   * - summary: resumen general
   */
  app.get("/api/reports/wait-times/complete", async (req, res, next) => {
    try {
      // Verificar autenticación y permisos
      if (!req.user) {
        return res.status(401).json({
          message: "Usuario no autenticado"
        });
      }

      if (!['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({
          message: "No autorizado para ver reportes"
        });
      }

      // Validar parámetros requeridos
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      // Validar formato de fechas
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DD)"
        });
      }

      if (start >= end) {
        return res.status(400).json({
          message: "La fecha de inicio debe ser anterior a la fecha de fin"
        });
      }

      // Validar rango de fechas (máximo 1 año)
      const maxRange = 365 * 24 * 60 * 60 * 1000;
      if ((end.getTime() - start.getTime()) > maxRange) {
        return res.status(400).json({
          message: "El rango de fechas no puede ser mayor a 1 año"
        });
      }

      // Construir filtros
      const filters: any = {
        dateRange: { startDate: start, endDate: end }
      };

      // Aplicar filtros opcionales
      if (req.query.branchId) {
        const branchId = parseInt(req.query.branchId as string);
        if (isNaN(branchId)) {
          return res.status(400).json({
            message: "branchId debe ser un número válido"
          });
        }
        filters.branchId = branchId;
      }

      if (req.query.serviceId) {
        const serviceId = parseInt(req.query.serviceId as string);
        if (isNaN(serviceId)) {
          return res.status(400).json({
            message: "serviceId debe ser un número válido"
          });
        }
        filters.serviceId = serviceId;
      }

      if (req.query.servicePointId) {
        const servicePointId = parseInt(req.query.servicePointId as string);
        if (isNaN(servicePointId)) {
          return res.status(400).json({
            message: "servicePointId debe ser un número válido"
          });
        }
        filters.servicePointId = servicePointId;
      }

      // Si el usuario es staff, solo puede ver datos de su sede
      if (req.user.role === 'staff' && req.user.branchId) {
        filters.branchId = req.user.branchId;
      }

      // Obtener todos los reportes en paralelo para mejor rendimiento
      const [byBranch, byService, byServicePoint, summary] = await Promise.all([
        waitTimeAnalyticsService.getWaitTimesByBranch(filters),
        waitTimeAnalyticsService.getWaitTimesByService(filters),
        waitTimeAnalyticsService.getWaitTimesByServicePoint(filters),
        waitTimeAnalyticsService.getWaitTimesSummary(filters)
      ]);

      res.json({
        success: true,
        data: {
          byBranch,
          byService,
          byServicePoint,
          summary
        },
        filters: {
          dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
          branchId: filters.branchId || null,
          serviceId: filters.serviceId || null,
          servicePointId: filters.servicePointId || null
        },
        metadata: {
          totalBranches: byBranch.length,
          totalServices: byService.length,
          totalServicePoints: byServicePoint.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generando reporte completo de tiempos de espera:', error);
      next(error);
    }
  });

  /**
   * Obtener metadatos para filtros de reportes de tiempos de espera
   * GET /api/reports/wait-times/metadata
   * 
   * Devuelve las opciones disponibles para filtros:
   * - branches: lista de sedes
   * - services: lista de servicios
   * - servicePoints: lista de puntos de atención
   */
  app.get("/api/reports/wait-times/metadata", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Construir queries base
      let branchesQuery, servicesQuery, servicePointsQuery;

      // Si el usuario es staff, filtrar por su sede
      if (req.user?.role === 'staff' && req.user?.branchId) {
        const userBranchId = req.user.branchId;
        
        branchesQuery = db
          .select({
            id: branches.id,
            name: branches.name,
            isActive: branches.isActive
          })
          .from(branches)
          .where(and(
            eq(branches.isActive, true),
            eq(branches.id, userBranchId)
          ))
          .orderBy(branches.name);

        servicesQuery = db
          .select({
            id: services.id,
            name: services.name,
            isActive: services.isActive
          })
          .from(services)
          .where(eq(services.isActive, true))
          .orderBy(services.name);

        servicePointsQuery = db
          .select({
            id: servicePoints.id,
            name: servicePoints.name,
            branchId: servicePoints.branchId,
            branchName: branches.name,
            isActive: servicePoints.isActive
          })
          .from(servicePoints)
          .innerJoin(branches, eq(servicePoints.branchId, branches.id))
          .where(and(
            eq(servicePoints.isActive, true),
            eq(branches.isActive, true),
            eq(servicePoints.branchId, userBranchId)
          ))
          .orderBy(branches.name, servicePoints.name);
      } else {
        // Usuario admin o visualizer - ver todas las opciones
        branchesQuery = db
          .select({
            id: branches.id,
            name: branches.name,
            isActive: branches.isActive
          })
          .from(branches)
          .where(eq(branches.isActive, true))
          .orderBy(branches.name);

        servicesQuery = db
          .select({
            id: services.id,
            name: services.name,
            isActive: services.isActive
          })
          .from(services)
          .where(eq(services.isActive, true))
          .orderBy(services.name);

        servicePointsQuery = db
          .select({
            id: servicePoints.id,
            name: servicePoints.name,
            branchId: servicePoints.branchId,
            branchName: branches.name,
            isActive: servicePoints.isActive
          })
          .from(servicePoints)
          .innerJoin(branches, eq(servicePoints.branchId, branches.id))
          .where(and(
            eq(servicePoints.isActive, true),
            eq(branches.isActive, true)
          ))
          .orderBy(branches.name, servicePoints.name);
      }

      // Ejecutar queries en paralelo
      const [branchesData, servicesData, servicePointsData] = await Promise.all([
        branchesQuery,
        servicesQuery,
        servicePointsQuery
      ]);

      res.json({
        success: true,
        data: {
          branches: branchesData,
          services: servicesData,
          servicePoints: servicePointsData
        },
        metadata: {
          totalBranches: branchesData.length,
          totalServices: servicesData.length,
          totalServicePoints: servicePointsData.length,
          userRole: req.user?.role,
          userBranchId: req.user?.branchId || null,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo metadatos para reportes:', error);
      next(error);
    }
  });

  // =========================================================================
  // === ENDPOINTS DE REPORTES DE CITAS ===
  // =========================================================================

  /**
   * Obtener resumen de métricas de citas
   * GET /api/reports/appointments/summary
   * 
   * Devuelve un resumen completo de métricas de citas:
   * - Total de citas
   * - Citas por estado (programadas, atendidas, canceladas, no-show)
   * - Tasas de asistencia y finalización
   * - Estadísticas de reprogramaciones
   */
  app.get("/api/reports/appointments/summary", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar y extraer parámetros de query
      const { startDate, endDate, branchId, serviceId, servicePointId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      // Aplicar filtros de permisos por rol
      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Si el usuario es staff, solo puede ver su sede
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      } else {
        // Para admin y visualizer, aplicar filtros opcionales
        if (branchId) filters.branchId = parseInt(branchId as string);
      }

      if (serviceId) filters.serviceId = parseInt(serviceId as string);
      if (servicePointId) filters.servicePointId = parseInt(servicePointId as string);

      // Obtener datos usando el servicio de analytics
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const summaryData = await AppointmentAnalyticsService.getAppointmentsSummary(filters);

      res.json({
        success: true,
        data: summaryData,
        filters: filters,
        metadata: {
          generatedAt: new Date().toISOString(),
          userRole: req.user?.role,
          period: `${startDate} - ${endDate}`
        }
      });

    } catch (error) {
      console.error('Error obteniendo resumen de citas:', error);
      next(error);
    }
  });

  /**
   * Obtener reportes de citas agrupadas por sede
   * GET /api/reports/appointments/by-branch
   */
  app.get("/api/reports/appointments/by-branch", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar parámetros
      const { startDate, endDate, serviceId, servicePointId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Aplicar filtros de rol
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      }

      if (serviceId) filters.serviceId = parseInt(serviceId as string);
      if (servicePointId) filters.servicePointId = parseInt(servicePointId as string);

      // Obtener datos
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const branchData = await AppointmentAnalyticsService.getAppointmentsByBranch(filters);

      res.json({
        success: true,
        data: branchData,
        filters: filters,
        metadata: {
          totalBranches: branchData.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo reportes por sede:', error);
      next(error);
    }
  });

  /**
   * Obtener reportes de citas agrupadas por servicio
   * GET /api/reports/appointments/by-service
   */
  app.get("/api/reports/appointments/by-service", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar parámetros
      const { startDate, endDate, branchId, servicePointId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Aplicar filtros de rol
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = parseInt(branchId as string);
      }

      if (servicePointId) filters.servicePointId = parseInt(servicePointId as string);

      // Obtener datos
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const serviceData = await AppointmentAnalyticsService.getAppointmentsByService(filters);

      res.json({
        success: true,
        data: serviceData,
        filters: filters,
        metadata: {
          totalServices: serviceData.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo reportes por servicio:', error);
      next(error);
    }
  });

  /**
   * Obtener estadísticas de colas/turnos
   * GET /api/reports/appointments/queues
   */
  app.get("/api/reports/appointments/queues", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar parámetros
      const { startDate, endDate, branchId, serviceId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Aplicar filtros de rol
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = parseInt(branchId as string);
      }

      if (serviceId) filters.serviceId = parseInt(serviceId as string);

      // Obtener datos
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const queueData = await AppointmentAnalyticsService.getQueueStatistics(filters);

      res.json({
        success: true,
        data: queueData,
        filters: filters,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de colas:', error);
      next(error);
    }
  });

  /**
   * Obtener estadísticas de reprogramaciones
   * GET /api/reports/appointments/reschedules
   */
  app.get("/api/reports/appointments/reschedules", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar parámetros
      const { startDate, endDate, branchId, serviceId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Aplicar filtros de rol
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = parseInt(branchId as string);
      }

      if (serviceId) filters.serviceId = parseInt(serviceId as string);

      // Obtener datos
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const rescheduleData = await AppointmentAnalyticsService.getReschedulingStats(filters);

      res.json({
        success: true,
        data: rescheduleData,
        filters: filters,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de reprogramaciones:', error);
      next(error);
    }
  });

  /**
   * Obtener distribución horaria de citas
   * GET /api/reports/appointments/hourly
   */
  app.get("/api/reports/appointments/hourly", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar parámetros
      const { startDate, endDate, branchId, serviceId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Aplicar filtros de rol
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = parseInt(branchId as string);
      }

      if (serviceId) filters.serviceId = parseInt(serviceId as string);

      // Obtener datos
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const hourlyData = await AppointmentAnalyticsService.getHourlyDistribution(filters);

      res.json({
        success: true,
        data: hourlyData,
        filters: filters,
        metadata: {
          totalHours: hourlyData.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo distribución horaria:', error);
      next(error);
    }
  });

  /**
   * Obtener tendencias de citas por fecha
   * GET /api/reports/appointments/trends
   */
  app.get("/api/reports/appointments/trends", async (req, res, next) => {
    try {
      // Verificar permisos
      const permissionCheck = checkReportPermissions(req);
      if (!permissionCheck.success) {
        return res.status(permissionCheck.error === "Usuario no autenticado" ? 401 : 403).json({
          message: permissionCheck.error
        });
      }

      // Validar parámetros
      const { startDate, endDate, branchId, serviceId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Los parámetros startDate y endDate son requeridos"
        });
      }

      let filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Aplicar filtros de rol
      if (req.user?.role === 'staff' && req.user?.branchId) {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = parseInt(branchId as string);
      }

      if (serviceId) filters.serviceId = parseInt(serviceId as string);

      // Obtener datos
      const { AppointmentAnalyticsService } = await import("./services/appointment-analytics");
      const trendData = await AppointmentAnalyticsService.getAppointmentTrends(filters);

      res.json({
        success: true,
        data: trendData,
        filters: filters,
        metadata: {
          totalDays: trendData.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error obteniendo tendencias de citas:', error);
      next(error);
    }
  });

  // === ENDPOINTS PARA GESTIÓN DEL SISTEMA DE "NO ASISTIÓ" ===

  /**
   * Obtener estadísticas del scheduler de no asistió (admin/staff).
   * GET /api/no-show/stats
   */
  app.get("/api/no-show/stats", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { noShowScheduler } = await import("./services/no-show-scheduler");
      const stats = noShowScheduler.getStats();
      const config = noShowScheduler.getConfig();

      res.json({
        stats,
        config,
        message: "Estadísticas obtenidas exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Actualizar configuración del scheduler de no asistió (admin).
   * PUT /api/no-show/config
   */
  app.put("/api/no-show/config", async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "No autorizado - Solo administradores" });
      }

      const { intervalMinutes, enabled, graceTimeMinutes } = req.body;

      // Validar datos de entrada
      if (intervalMinutes && (intervalMinutes < 5 || intervalMinutes > 1440)) {
        return res.status(400).json({ 
          message: "El intervalo debe estar entre 5 y 1440 minutos" 
        });
      }

      if (graceTimeMinutes && (graceTimeMinutes < 0 || graceTimeMinutes > 1440)) {
        return res.status(400).json({ 
          message: "El tiempo de gracia debe estar entre 0 y 1440 minutos" 
        });
      }

      const { noShowScheduler } = await import("./services/no-show-scheduler");
      
      const newConfig = {
        ...(intervalMinutes !== undefined && { intervalMinutes }),
        ...(enabled !== undefined && { enabled }),
        ...(graceTimeMinutes !== undefined && { graceTimeMinutes })
      };

      noShowScheduler.updateConfig(newConfig);
      const updatedConfig = noShowScheduler.getConfig();

      res.json({
        config: updatedConfig,
        message: "Configuración actualizada exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Ejecutar manualmente el marcado de no asistió (admin/staff).
   * POST /api/no-show/execute
   */
  app.post("/api/no-show/execute", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { noShowScheduler } = await import("./services/no-show-scheduler");
      
      // Ejecutar el procesamiento manualmente
      await noShowScheduler.executeManually();
      
      const stats = noShowScheduler.getStats();

      res.json({
        stats,
        message: "Procesamiento manual ejecutado exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Marcar manualmente una cita como no asistió (admin/staff).
   * POST /api/appointments/:id/mark-no-show
   */
  app.post("/api/appointments/:id/mark-no-show", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const appointmentId = parseInt(req.params.id);
      const { reason } = req.body;

      // Buscar la cita
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Validar que staff solo gestione citas de su sede
      if (req.user.role === 'staff' && req.user.branchId && appointment.branchId !== req.user.branchId) {
        return res.status(403).json({ 
          message: "No autorizado para gestionar citas de otras sedes" 
        });
      }

      // Validar que la cita pueda marcarse como no asistió
      if (appointment.status === "no-show") {
        return res.status(400).json({ message: "La cita ya está marcada como no asistió" });
      }

      if (appointment.status === "checked-in") {
        return res.status(400).json({ message: "No se puede marcar como no asistió una cita con check-in" });
      }

      if (appointment.status === "completed") {
        return res.status(400).json({ message: "No se puede marcar como no asistió una cita completada" });
      }

      if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "No se puede marcar como no asistió una cita cancelada" });
      }

      // Marcar la cita como no asistió
      const now = new Date();
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          status: 'no-show',
          noShowMarkedAt: now,
          autoMarkedAsNoShow: false, // Marcado manualmente
          updatedAt: now
        })
        .where(eq(appointments.id, appointmentId))
        .returning();

      res.json({
        appointment: updatedAppointment,
        message: "Cita marcada como no asistió exitosamente",
        reason: reason || null
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * Obtener reporte de citas marcadas como no asistió (admin/staff).
   * GET /api/no-show/report
   */
  app.get("/api/no-show/report", async (req, res, next) => {
    try {
      if (!req.user || !["admin", "staff"].includes(req.user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { startDate, endDate, branchId, autoMarked } = req.query;
      
      let whereConditions = [eq(appointments.status, 'no-show')];
      
      if (startDate) {
        whereConditions.push(gte(appointments.noShowMarkedAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(appointments.noShowMarkedAt, new Date(endDate as string)));
      }

      if (branchId) {
        whereConditions.push(eq(appointments.branchId, parseInt(branchId as string)));
      }

      if (autoMarked !== undefined) {
        whereConditions.push(eq(appointments.autoMarkedAsNoShow, autoMarked === 'true'));
      }

      // Para staff, solo mostrar datos de su sede
      if (req.user.role === "staff" && req.user.branchId) {
        whereConditions.push(eq(appointments.branchId, req.user.branchId));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Obtener citas marcadas como no asistió
      const noShowAppointments = await db
        .select({
          id: appointments.id,
          confirmationCode: appointments.confirmationCode,
          scheduledAt: appointments.scheduledAt,
          noShowMarkedAt: appointments.noShowMarkedAt,
          autoMarkedAsNoShow: appointments.autoMarkedAsNoShow,
          guestName: appointments.guestName,
          guestEmail: appointments.guestEmail,
          serviceName: services.name,
          branchName: branches.name,
          username: users.username,
          userEmail: users.email
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .leftJoin(branches, eq(appointments.branchId, branches.id))
        .leftJoin(users, eq(appointments.userId, users.id))
        .where(whereClause)
        .orderBy(desc(appointments.noShowMarkedAt));

      res.json({
        appointments: noShowAppointments,
        total: noShowAppointments.length,
        message: "Reporte generado exitosamente"
      });

    } catch (error) {
      next(error);
    }
  });

  // Middleware de manejo de errores (debe ir al final)
  app.use((err: any, _req: any, res: any, next: any) => {
    console.error('Error in route:', err);
    if (err) {
      return res.status(err.status || 500).json({
        message: err.message || "Internal server error"
      });
    }
    next();
  });

  // Inicializar el scheduler de recordatorios automáticos
  try {
    const { reminderScheduler } = await import('./services/reminder-scheduler');
    reminderScheduler.start();
    console.log('🔔 Scheduler de recordatorios automáticos iniciado');
    
    // Graceful shutdown del scheduler
    process.on('SIGTERM', () => {
      console.log('🛑 Cerrando scheduler de recordatorios...');
      reminderScheduler.stop();
    });

    process.on('SIGINT', () => {
      console.log('🛑 Cerrando scheduler de recordatorios...');
      reminderScheduler.stop();
    });
  } catch (schedulerError) {
    console.error('❌ Error iniciando scheduler de recordatorios:', schedulerError);
  }

  return httpServer;
}