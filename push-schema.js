// Script para ejecutar la migración del esquema a la base de datos
const { drizzle } = require('drizzle-orm/neon-serverless');
const { migrate } = require('drizzle-orm/neon-serverless/migrator');
const { neon } = require('@neondatabase/serverless');
const { Pool } = require('pg');

async function main() {
  console.log('Iniciando migración del esquema...');

  // Utilizar directamente la URL de la base de datos desde las variables de entorno
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: Variable de entorno DATABASE_URL no encontrada');
    process.exit(1);
  }

  try {
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    console.log('Conectado a la base de datos. Aplicando esquema...');

    // Importar dinámicamente el esquema
    const schema = require('./db/schema');


    // Crear la tabla self_service_services si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS "self_service_services" (
        "id" SERIAL PRIMARY KEY,
        "self_service_id" INTEGER NOT NULL REFERENCES "self_services"("id"),
        "service_id" INTEGER NOT NULL REFERENCES "services"("id"),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `;

    // Crear tabla custom_booking_pages si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS "custom_booking_pages" (
        "id" SERIAL PRIMARY KEY,
        "branch_id" INTEGER NOT NULL REFERENCES "branches"("id"),
        "theme_config" JSON,
        "hero_title" TEXT,
        "hero_subtitle" TEXT,
        "hero_background_image" TEXT,
        "step1_title" TEXT DEFAULT 'Selecciona tu servicio',
        "step1_description" TEXT,
        "step2_title" TEXT DEFAULT 'Elige fecha y hora',
        "step2_description" TEXT,
        "step3_title" TEXT DEFAULT 'Completa tus datos',
        "step3_description" TEXT,
        "success_message" TEXT,
        "error_message" TEXT,
        "loading_message" TEXT,
        "require_terms_acceptance" BOOLEAN NOT NULL DEFAULT false,
        "terms_text" TEXT,
        "privacy_policy_url" TEXT,
        "custom_javascript" TEXT,
        "google_analytics_id" TEXT,
        "facebook_pixel_id" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "last_modified_by" INTEGER REFERENCES "users"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `;

    // Añadir campos de personalización a branches si no existen
    await sql`
      ALTER TABLE "branches" 
      ADD COLUMN IF NOT EXISTS "logo_url" TEXT,
      ADD COLUMN IF NOT EXISTS "header_color" TEXT DEFAULT '#1f2937',
      ADD COLUMN IF NOT EXISTS "font_color" TEXT DEFAULT '#ffffff',
      ADD COLUMN IF NOT EXISTS "accent_color" TEXT DEFAULT '#3b82f6',
      ADD COLUMN IF NOT EXISTS "background_color" TEXT DEFAULT '#f9fafb',
      ADD COLUMN IF NOT EXISTS "facebook_url" TEXT,
      ADD COLUMN IF NOT EXISTS "instagram_url" TEXT,
      ADD COLUMN IF NOT EXISTS "twitter_url" TEXT,
      ADD COLUMN IF NOT EXISTS "custom_page_enabled" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "page_slug" TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS "welcome_message" TEXT,
      ADD COLUMN IF NOT EXISTS "custom_css" TEXT,
      ADD COLUMN IF NOT EXISTS "page_title" TEXT,
      ADD COLUMN IF NOT EXISTS "page_description" TEXT,
      ADD COLUMN IF NOT EXISTS "meta_keywords" TEXT,
      ADD COLUMN IF NOT EXISTS "show_social_media" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "enable_whatsapp" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "whatsapp_number" TEXT,
      ADD COLUMN IF NOT EXISTS "custom_footer_text" TEXT;
    `;

    console.log('Esquema aplicado correctamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

main();