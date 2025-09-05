// Script para crear la tabla faltante en la base de datos
const { neon } = require('@neondatabase/serverless');

async function main() {
  console.log('Iniciando creación de tabla faltante...');

  // Utilizar directamente la URL de la base de datos desde las variables de entorno
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: Variable de entorno DATABASE_URL no encontrada');
    process.exit(1);
  }

  try {
    const sql = neon(databaseUrl);

    console.log('Conectado a la base de datos. Actualizando tabla...');

    // Primero comprobar si la tabla existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'self_service_services'
      );
    `;

    if (!tableExists[0].exists) {
      // Crear la tabla si no existe
      await sql`
        CREATE TABLE IF NOT EXISTS "self_service_services" (
          "id" SERIAL PRIMARY KEY,
          "self_service_id" INTEGER NOT NULL REFERENCES "self_services"("id"),
          "service_id" INTEGER NOT NULL REFERENCES "services"("id"),
          "form_id" INTEGER REFERENCES "forms"("id"),
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      console.log('Tabla creada correctamente');
    } else {
      // Comprobar si la columna form_id ya existe
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'self_service_services' AND column_name = 'form_id'
        );
      `;

      if (!columnExists[0].exists) {
        // Añadir la columna si no existe
        await sql`
          ALTER TABLE "self_service_services" 
          ADD COLUMN "form_id" INTEGER REFERENCES "forms"("id");
        `;
        console.log('Columna form_id añadida correctamente');
      } else {
        console.log('La columna form_id ya existe, no es necesario hacer cambios');
      }
    }

    console.log('Operación completada correctamente');
  } catch (error) {
    console.error('Error durante la operación:', error);
    process.exit(1);
  }
}

main();