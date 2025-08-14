import { pgTable, serial, text, timestamp, integer, boolean, date, time, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["user", "admin", "staff", "selfservice", "visualizer"] }).default("user").notNull(),
  branchId: integer("branch_id").references(() => branches.id), // Sede asignada para usuarios con rol staff
  isActive: boolean("is_active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabla de formularios dinámicos (debe ir antes de services para las referencias)
export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").references(() => forms.id).notNull(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  type: text("type", { enum: ["text", "number", "email", "date", "select", "checkbox", "textarea"] }).notNull(),
  required: boolean("required").default(false).notNull(),
  options: json("options"), // Para campos select, almacenados como JSON
  order: integer("order").notNull(),
  helperText: text("helper_text"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  formId: integer("form_id").references(() => forms.id), // Optional form assignment
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// === TABLA DE CONFIGURACIÓN DE PÁGINAS PERSONALIZADAS ===
export const customBookingPages = pgTable("custom_booking_pages", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id).notNull(),
  
  // Configuración de diseño
  themeConfig: json("theme_config"), // JSON con configuración completa del tema
  
  // Contenido personalizado
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroBackgroundImage: text("hero_background_image"),
  
  // Configuración de pasos del formulario
  step1Title: text("step1_title").default("Selecciona tu servicio"),
  step1Description: text("step1_description"),
  step2Title: text("step2_title").default("Elige fecha y hora"),
  step2Description: text("step2_description"),
  step3Title: text("step3_title").default("Completa tus datos"),
  step3Description: text("step3_description"),
  
  // Mensajes personalizados
  successMessage: text("success_message"),
  errorMessage: text("error_message"),
  loadingMessage: text("loading_message"),
  
  // Configuración de validación
  requireTermsAcceptance: boolean("require_terms_acceptance").default(false),
  termsText: text("terms_text"),
  privacyPolicyUrl: text("privacy_policy_url"),
  
  // Configuración técnica
  customJavaScript: text("custom_javascript"),
  googleAnalyticsId: text("google_analytics_id"),
  facebookPixelId: text("facebook_pixel_id"),
  
  // Estado y auditoría
  isActive: boolean("is_active").default(true).notNull(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabla de sedes/sucursales
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // === PERSONALIZACIÓN DE PÁGINA DE RESERVAS ===
  // Configuración visual
  logoUrl: text("logo_url"),
  headerColor: text("header_color").default("#1f2937"),
  fontColor: text("font_color").default("#ffffff"),
  accentColor: text("accent_color").default("#3b82f6"),
  backgroundColor: text("background_color").default("#f9fafb"),
  
  // Redes sociales (opcionales)
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  
  // Configuración de página personalizada
  customPageEnabled: boolean("custom_page_enabled").default(false),
  pageSlug: text("page_slug"), // Removemos .unique() temporalmente
  welcomeMessage: text("welcome_message"),
  customCss: text("custom_css"),
  
  // SEO y metadatos
  pageTitle: text("page_title"),
  pageDescription: text("page_description"),
  metaKeywords: text("meta_keywords"),
  
  // Configuración adicional
  showSocialMedia: boolean("show_social_media").default(true),
  enableWhatsApp: boolean("enable_whatsapp").default(false),
  whatsappNumber: text("whatsapp_number"),
  customFooterText: text("custom_footer_text")
});

// === TABLA DE CONFIGURACIÓN DE PARÁMETROS POR SEDE ===
export const branchSettings = pgTable("branch_settings", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id).notNull().unique(),
  
  // Configuración almacenada como JSON para flexibilidad
  settings: json("settings").notNull().default('{}'),
  
  // Auditoría y control de versiones
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  
  // Campos para configuraciones críticas (indexadas para performance)
  cancellationHours: integer("cancellation_hours").default(24).notNull(),
  rescheduleTimeLimit: integer("reschedule_time_limit").default(4).notNull(),
  maxAdvanceBookingDays: integer("max_advance_booking_days").default(30).notNull(),
  remindersEnabled: boolean("reminders_enabled").default(true).notNull(),
  reminderHours: integer("reminder_hours").default(24).notNull(), // Horas antes para enviar recordatorio
  reminderMessage: text("reminder_message"), // Mensaje personalizado para recordatorios por email
  emergencyMode: boolean("emergency_mode").default(false).notNull(),
  
  // Estado de la configuración
  isActive: boolean("is_active").default(true).notNull()
});

export const servicePoints = pgTable("service_points", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const servicePointServices = pgTable("service_point_services", {
  id: serial("id").primaryKey(),
  servicePointId: integer("service_point_id").references(() => servicePoints.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});

// Tabla de relación entre sedes y servicios
export const branchServices = pgTable("branch_services", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Opcional para citas públicas
  serviceId: integer("service_id").references(() => services.id).notNull(),
  branchId: integer("branch_id").references(() => branches.id).notNull(), // Sede donde se realizará la cita
  servicePointId: integer("service_point_id").references(() => servicePoints.id),
  confirmationCode: text("confirmation_code"),
  qrCode: text("qr_code"), // Código QR en formato base64 para check-in
  status: text("status", { enum: ["scheduled", "checked-in", "completed", "cancelled", "no-show"] }).default("scheduled").notNull(),
  type: text("type", { enum: ["appointment", "turn", "public"] }).default("appointment").notNull(), // Nuevo tipo 'public'
  scheduledAt: timestamp("scheduled_at").notNull(),
  attendedAt: timestamp("attended_at"),
  noShowMarkedAt: timestamp("no_show_marked_at"), // Fecha cuando se marcó como no asistió
  autoMarkedAsNoShow: boolean("auto_marked_as_no_show").default(false), // Si fue marcado automáticamente
  formData: json("form_data"),
  // Campos para citas públicas anónimas
  guestName: text("guest_name"), // Nombre del cliente para citas públicas
  guestEmail: text("guest_email"), // Email del cliente para citas públicas
  guestPhone: text("guest_phone"), // Teléfono del cliente para citas públicas
  guestNotes: text("guest_notes"), // Notas adicionales del cliente
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  rescheduledFromId: integer("rescheduled_from_id"), // Referencia a la cita original - se define en relaciones
  rescheduledById: integer("rescheduled_by_id").references(() => users.id), // Usuario que hizo la reprogramación
  rescheduledAt: timestamp("rescheduled_at"),
  rescheduledReason: text("rescheduled_reason"), // Motivo de la reprogramación
  originalScheduledAt: timestamp("original_scheduled_at"), // Fecha/hora original para historial
});

// Tabla de historial de reprogramaciones
export const appointmentReschedules = pgTable("appointment_reschedules", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  originalScheduledAt: timestamp("original_scheduled_at").notNull(),
  newScheduledAt: timestamp("new_scheduled_at").notNull(),
  rescheduledById: integer("rescheduled_by_id").references(() => users.id).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const queues = pgTable("queues", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  counter: integer("counter").notNull(),
  status: text("status", { enum: ["waiting", "serving", "complete"] }).default("waiting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at")
});

// Tabla de autoservicios
export const selfServices = pgTable("self_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabla de relación entre autoservicios y puntos de atención
export const selfServiceServicePoints = pgTable("self_service_service_points", {
  id: serial("id").primaryKey(),
  selfServiceId: integer("self_service_id").references(() => selfServices.id).notNull(),
  servicePointId: integer("service_point_id").references(() => servicePoints.id).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});

// Tabla de relación entre autoservicios y servicios
export const selfServiceServices = pgTable("self_service_services", {
  id: serial("id").primaryKey(),
  selfServiceId: integer("self_service_id").references(() => selfServices.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});

// === SISTEMA DE ENCUESTAS DE SATISFACCIÓN ===

// Tabla principal de encuestas de satisfacción
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  queueId: integer("queue_id").references(() => queues.id),
  userId: integer("user_id").references(() => users.id), // Opcional para walk-ins
  branchId: integer("branch_id").references(() => branches.id).notNull(), // Sede donde se realizó el servicio
  serviceId: integer("service_id").references(() => services.id).notNull(), // Servicio evaluado
  surveyToken: text("survey_token").unique().notNull(), // Token único para acceso anónimo
  emailAddress: text("email_address"), // Email para envío (puede ser diferente al del user)
  patientName: text("patient_name"), // Nombre del paciente (para walk-ins sin usuario)
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  emailSent: boolean("email_sent").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  qrCode: text("qr_code"), // QR code para acceso directo a la encuesta
  overallRating: integer("overall_rating"), // 1-5 calificación general
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabla de preguntas de encuesta predefinidas
export const surveyQuestions = pgTable("survey_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  questionEn: text("question_en"), // Pregunta en inglés
  type: text("type", { 
    enum: ["rating", "multiple_choice", "text", "yes_no", "nps"] 
  }).notNull(),
  options: json("options"), // Para preguntas de opción múltiple
  order: integer("order").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  category: text("category").default("general").notNull(), // Categoría de la pregunta
  branchId: integer("branch_id").references(() => branches.id).notNull(), // Sede asignada a la pregunta
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabla de respuestas a las encuestas
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  questionId: integer("question_id").references(() => surveyQuestions.id).notNull(),
  response: text("response"), // Opcional: para preguntas de texto y opción múltiple
  numericValue: integer("numeric_value"), // Para ratings y NPS
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// === TABLA DE RECORDATORIOS DE CITAS ===
/**
 * Tabla para trackear recordatorios enviados por email
 * Permite control de estado y evitar duplicados
 */
export const appointmentReminders = pgTable("appointment_reminders", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  reminderType: text("reminder_type", { enum: ["email"] }).default("email").notNull(), // Solo email por ahora
  scheduledAt: timestamp("scheduled_at").notNull(), // Cuándo se programó enviar
  sentAt: timestamp("sent_at"), // Cuándo se envió realmente
  status: text("status", { enum: ["pending", "sent", "failed", "cancelled"] }).default("pending").notNull(),
  emailAddress: text("email_address").notNull(), // Email destino
  errorMessage: text("error_message"), // En caso de fallo
  retryCount: integer("retry_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id]
  })
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  servicePoints: many(servicePoints),
  branchServices: many(branchServices),
  appointments: many(appointments), // Citas programadas en esta sede
  staff: many(users), // Operadores asignados a esta sede
  surveys: many(surveys), // Encuestas realizadas en esta sede
  surveyQuestions: many(surveyQuestions), // Preguntas de encuesta específicas de esta sede
  customBookingPage: one(customBookingPages, {
    fields: [branches.id],
    references: [customBookingPages.branchId]
  }),
  // Configuración de parámetros específicos de la sede
  settings: one(branchSettings, {
    fields: [branches.id],
    references: [branchSettings.branchId]
  })
}));

export const branchServicesRelations = relations(branchServices, ({ one }) => ({
  branch: one(branches, {
    fields: [branchServices.branchId],
    references: [branches.id]
  }),
  service: one(services, {
    fields: [branchServices.serviceId],
    references: [services.id]
  })
}));

// === RELACIONES PARA CONFIGURACIÓN DE PARÁMETROS POR SEDE ===
export const branchSettingsRelations = relations(branchSettings, ({ one }) => ({
  branch: one(branches, {
    fields: [branchSettings.branchId],
    references: [branches.id]
  }),
  createdByUser: one(users, {
    fields: [branchSettings.createdBy],
    references: [users.id]
  }),
  updatedByUser: one(users, {
    fields: [branchSettings.updatedBy],
    references: [users.id]
  })
}));

export const servicePointsRelations = relations(servicePoints, ({ one, many }) => ({
  branch: one(branches, {
    fields: [servicePoints.branchId],
    references: [branches.id]
  }),
  services: many(servicePointServices),
  appointments: many(appointments)
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  user: one(users, {
    fields: [appointments.userId],  
    references: [users.id]
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id]
  }),
  branch: one(branches, {
    fields: [appointments.branchId],
    references: [branches.id]
  }),
  servicePoint: one(servicePoints, {
    fields: [appointments.servicePointId],
    references: [servicePoints.id]
  }),
  surveys: many(surveys), // Encuestas relacionadas con esta cita
  rescheduledFrom: one(appointments, {
    fields: [appointments.rescheduledFromId],
    references: [appointments.id],
    relationName: "appointmentReschedule"
  }),
  rescheduledTo: many(appointments, {
    relationName: "appointmentReschedule"
  }),
  rescheduledBy: one(users, {
    fields: [appointments.rescheduledById],
    references: [users.id]
  }),
  rescheduleHistory: many(appointmentReschedules)
}));

export const servicePointServicesRelations = relations(servicePointServices, ({ one }) => ({
  servicePoint: one(servicePoints, {
    fields: [servicePointServices.servicePointId],
    references: [servicePoints.id]
  }),
  service: one(services, {
    fields: [servicePointServices.serviceId],
    references: [services.id]
  })
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  service: one(services, {
    fields: [schedules.serviceId],
    references: [services.id]
  })
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  form: one(forms, {
    fields: [services.formId],
    references: [forms.id]
  }),
  appointments: many(appointments),
  schedules: many(schedules),
  branchServices: many(branchServices),
  servicePointServices: many(servicePointServices),
  selfServiceServices: many(selfServiceServices),
  surveys: many(surveys), // Encuestas relacionadas con este servicio
}));

export const queuesRelations = relations(queues, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [queues.appointmentId],
    references: [appointments.id]
  }),
  surveys: many(surveys) // Encuestas relacionadas con esta entrada de cola
}));

export const formsRelations = relations(forms, ({ many }) => ({
  fields: many(formFields),
  services: many(services)
}));

export const formFieldsRelations = relations(formFields, ({ one }) => ({
  form: one(forms, {
    fields: [formFields.formId],
    references: [forms.id]
  })
}));

export const selfServicesRelations = relations(selfServices, ({ many }) => ({
  servicePoints: many(selfServiceServicePoints),
  services: many(selfServiceServices)
}));

export const selfServiceServicePointsRelations = relations(selfServiceServicePoints, ({ one }) => ({
  selfService: one(selfServices, {
    fields: [selfServiceServicePoints.selfServiceId],
    references: [selfServices.id]
  }),
  servicePoint: one(servicePoints, {
    fields: [selfServiceServicePoints.servicePointId],
    references: [servicePoints.id]
  })
}));

export const selfServiceServicesRelations = relations(selfServiceServices, ({ one }) => ({
  selfService: one(selfServices, {
    fields: [selfServiceServices.selfServiceId],
    references: [selfServices.id]
  }),
  service: one(services, {
    fields: [selfServiceServices.serviceId],
    references: [services.id]
  })
}));

// === RELACIONES PARA SISTEMA DE ENCUESTAS ===

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [surveys.appointmentId],
    references: [appointments.id]
  }),
  queue: one(queues, {
    fields: [surveys.queueId],
    references: [queues.id]
  }),
  user: one(users, {
    fields: [surveys.userId],
    references: [users.id]
  }),
  branch: one(branches, {
    fields: [surveys.branchId],
    references: [branches.id]
  }),
  service: one(services, {
    fields: [surveys.serviceId],
    references: [services.id]
  }),
  responses: many(surveyResponses)
}));

export const surveyQuestionsRelations = relations(surveyQuestions, ({ one, many }) => ({
  branch: one(branches, {
    fields: [surveyQuestions.branchId],
    references: [branches.id]
  }),
  responses: many(surveyResponses)
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id]
  }),
  question: one(surveyQuestions, {
    fields: [surveyResponses.questionId],
    references: [surveyQuestions.id]
  })
}));

// Relaciones para historial de reprogramaciones
export const appointmentReschedulesRelations = relations(appointmentReschedules, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentReschedules.appointmentId],
    references: [appointments.id]
  }),
  rescheduledBy: one(users, {
    fields: [appointmentReschedules.rescheduledById],
    references: [users.id]
  })
}));

// === RELACIONES PARA PÁGINAS PERSONALIZADAS ===

export const customBookingPagesRelations = relations(customBookingPages, ({ one }) => ({
  branch: one(branches, {
    fields: [customBookingPages.branchId],
    references: [branches.id]
  }),
  lastModifiedByUser: one(users, {
    fields: [customBookingPages.lastModifiedBy],
    references: [users.id]
  })
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertBranchSchema = createInsertSchema(branches);
export const selectBranchSchema = createSelectSchema(branches);

export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);

export const insertServicePointSchema = createInsertSchema(servicePoints);
export const selectServicePointSchema = createSelectSchema(servicePoints);

export const insertServicePointServicesSchema = createInsertSchema(servicePointServices);
export const selectServicePointServicesSchema = createSelectSchema(servicePointServices);

export const insertScheduleSchema = createInsertSchema(schedules);
export const selectScheduleSchema = createSelectSchema(schedules);

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);

export const insertQueueSchema = createInsertSchema(queues);
export const selectQueueSchema = createSelectSchema(queues);

export const insertFormSchema = createInsertSchema(forms);
export const selectFormSchema = createSelectSchema(forms);

export const insertFormFieldSchema = createInsertSchema(formFields);
export const selectFormFieldSchema = createSelectSchema(formFields);

export const insertSelfServiceSchema = createInsertSchema(selfServices);
export const selectSelfServiceSchema = createSelectSchema(selfServices);

export const insertSelfServiceServicePointsSchema = createInsertSchema(selfServiceServicePoints);
export const selectSelfServiceServicePointsSchema = createSelectSchema(selfServiceServicePoints);

export const insertSelfServiceServicesSchema = createInsertSchema(selfServiceServices);
export const selectSelfServiceServicesSchema = createSelectSchema(selfServiceServices);

// === SCHEMAS DE VALIDACIÓN PARA PÁGINAS PERSONALIZADAS ===
export const insertCustomBookingPageSchema = createInsertSchema(customBookingPages);
export const selectCustomBookingPageSchema = createSelectSchema(customBookingPages);

// === SCHEMAS DE VALIDACIÓN PARA ENCUESTAS ===
export const insertSurveySchema = createInsertSchema(surveys);
export const selectSurveySchema = createSelectSchema(surveys);

export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions);
export const selectSurveyQuestionSchema = createSelectSchema(surveyQuestions);

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses);
export const selectSurveyResponseSchema = createSelectSchema(surveyResponses);

// === SCHEMAS DE VALIDACIÓN PARA CONFIGURACIÓN DE PARÁMETROS POR SEDE ===
export const insertBranchSettingsSchema = createInsertSchema(branchSettings);
export const selectBranchSettingsSchema = createSelectSchema(branchSettings);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type ServicePoint = typeof servicePoints.$inferSelect;
export type NewServicePoint = typeof servicePoints.$inferInsert;

export type ServicePointService = typeof servicePointServices.$inferSelect;
export type NewServicePointService = typeof servicePointServices.$inferInsert;

export type BranchService = typeof branchServices.$inferSelect;
export type NewBranchService = typeof branchServices.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Queue = typeof queues.$inferSelect;
export type NewQueue = typeof queues.$inferInsert;

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;

export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;

export type SelfService = typeof selfServices.$inferSelect;
export type NewSelfService = typeof selfServices.$inferInsert;

export type SelfServiceServicePoint = typeof selfServiceServicePoints.$inferSelect;
export type NewSelfServiceServicePoint = typeof selfServiceServicePoints.$inferInsert;

export type SelfServiceService = typeof selfServiceServices.$inferSelect;
export type NewSelfServiceService = typeof selfServiceServices.$inferInsert;

// === TIPOS TYPESCRIPT PARA PÁGINAS PERSONALIZADAS ===
export type CustomBookingPage = typeof customBookingPages.$inferSelect;
export type NewCustomBookingPage = typeof customBookingPages.$inferInsert;

// === TIPOS TYPESCRIPT PARA ENCUESTAS ===
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type NewSurveyQuestion = typeof surveyQuestions.$inferInsert;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;

// === TIPOS TYPESCRIPT PARA CONFIGURACIÓN DE PARÁMETROS POR SEDE ===
export type BranchSettings = typeof branchSettings.$inferSelect;
export type NewBranchSettings = typeof branchSettings.$inferInsert;

// Tipos extendidos para consultas con joins
export type ServicePointWithBranch = ServicePoint & {
  branchName?: string;
};

export type BranchWithCustomPage = Branch & {
  customBookingPage?: CustomBookingPage;
};

export type CustomBookingPageWithBranch = CustomBookingPage & {
  branch?: Branch;
  lastModifiedByUser?: Pick<User, 'id' | 'username' | 'email'>;
};

// Tipos para configuración de tema (JSON)
export type ThemeConfig = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
    size: {
      small: string;
      medium: string;
      large: string;
    };
  };
  spacing: {
    section: string;
    component: string;
  };
  borderRadius: string;
  shadows: boolean;
};

// Tipo para validación de configuración de página personalizada
export type CustomPageFormData = {
  // Información básica
  pageSlug: string;
  pageTitle: string;
  pageDescription?: string;
  welcomeMessage?: string;
  
  // Configuración visual
  logoUrl?: string;
  headerColor: string;
  fontColor: string;
  accentColor: string;
  backgroundColor: string;
  
  // Redes sociales
  showSocialMedia: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  
  // WhatsApp
  enableWhatsApp: boolean;
  whatsappNumber?: string;
  
  // Contenido personalizado
  heroTitle?: string;
  heroSubtitle?: string;
  customFooterText?: string;
  
  // Configuración técnica
  requireTermsAcceptance: boolean;
  termsText?: string;
  privacyPolicyUrl?: string;
  
  // Estado
  customPageEnabled: boolean;
};

// === CONFIGURACIÓN DE PARÁMETROS POR SEDE ===
// Esquema completo para las configuraciones almacenadas en JSON
export type BranchSettingsConfig = {
  // === CONFIGURACIÓN DE CANCELACIONES ===
  cancellation: {
    allowCancellation: boolean;
    cancellationHours: number; // Horas mínimas antes de la cita para cancelar
    requireReason: boolean;
    sendConfirmationEmail: boolean;
    refundPolicy?: string;
  };

  // === CONFIGURACIÓN DE REAGENDAMIENTO ===
  rescheduling: {
    allowRescheduling: boolean;
    rescheduleTimeLimit: number; // Horas mínimas antes de la cita para reagendar
    maxReschedules: number; // Número máximo de reagendamientos por cita
    requireReason: boolean;
    sendConfirmationEmail: boolean;
  };

  // === CONFIGURACIÓN DE RESERVAS ===
  booking: {
    maxAdvanceBookingDays: number; // Días máximos de anticipación para reservar
    minAdvanceBookingHours: number; // Horas mínimas de anticipación para reservar
    allowSameDayBooking: boolean;
    requireDocumentVerification: boolean;
    maxAppointmentsPerUser: number; // Máximo de citas activas por usuario
    allowRecurringAppointments: boolean;
  };

  // === CONFIGURACIÓN DE RECORDATORIOS ===
  reminders: {
    enabled: boolean;
    emailReminders: {
      enabled: boolean;
      times: number[]; // Horas antes de la cita para enviar recordatorios [24, 2, 1]
      template?: string;
      customMessage?: string; // Mensaje personalizado con placeholders
    };
    smsReminders?: {
      enabled: boolean;
      times: number[]; // Horas antes de la cita para enviar SMS
      template?: string;
    };
    whatsappReminders?: {
      enabled: boolean;
      times: number[]; // Horas antes de la cita para enviar WhatsApp
      template?: string;
    };
  };

  // === CONFIGURACIÓN DE NOTIFICACIONES ===
  notifications: {
    appointmentConfirmation: {
      email: boolean;
      sms?: boolean;
      whatsapp?: boolean;
    };
    appointmentReminder: {
      email: boolean;
      sms?: boolean;
      whatsapp?: boolean;
    };
    adminNotifications: {
      newAppointment: boolean;
      cancellation: boolean;
      noShow: boolean;
    };
  };

  // === CONFIGURACIÓN DE HORARIOS ESPECIALES ===
  specialSchedules: {
    enabled: boolean;
    holidays: Array<{
      date: string; // Formato YYYY-MM-DD
      name: string;
      closed: boolean;
      customHours?: {
        start: string; // Formato HH:MM
        end: string;   // Formato HH:MM
      };
    }>;
    exceptionalDays: Array<{
      date: string;
      reason: string;
      closed: boolean;
      customHours?: {
        start: string;
        end: string;
      };
    }>;
  };

  // === CONFIGURACIÓN DE AUTOSERVICIO ===
  selfService: {
    enabled: boolean;
    requireRegistration: boolean;
    allowWalkIn: boolean; // Permitir llegada sin cita previa
    kioskMode: boolean; // Modo kiosco para autoservicio
    printTickets: boolean; // Imprimir tickets físicos
    digitalTickets: boolean; // Tickets digitales (QR, SMS)
    estimateWaitTime: boolean; // Mostrar tiempo estimado de espera
  };

  // === CONFIGURACIÓN DE EMERGENCIAS ===
  emergency: {
    mode: boolean; // Modo de emergencia activado
    priorityServices: number[]; // IDs de servicios prioritarios
    extendedHours: boolean; // Horarios extendidos
    skipQueue: boolean; // Saltar cola para casos de emergencia
    emergencyContact?: string; // Contacto de emergencia
  };
};

// Tipo extendido que incluye la configuración JSON
export type BranchSettingsWithConfig = BranchSettings & {
  config?: BranchSettingsConfig;
};

// Tipo para formularios de configuración
export type BranchSettingsFormData = {
  branchId: number;
  settings: BranchSettingsConfig;
  // Campos críticos también como propiedades directas
  cancellationHours: number;
  rescheduleTimeLimit: number;
  maxAdvanceBookingDays: number;
  remindersEnabled: boolean;
  reminderHours: number;
  reminderMessage: string | null;
  emergencyMode: boolean;
  isActive: boolean;
};