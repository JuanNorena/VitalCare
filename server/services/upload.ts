import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import sharp from 'sharp';

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

/**
 * Servicio para manejo de archivos subidos (logos, imágenes, etc.)
 * 
 * Proporciona funcionalidades para:
 * - Subida de archivos con validación
 * - Redimensionamiento automático de imágenes
 * - Generación de nombres únicos
 * - Limpieza de archivos antiguos
 * - Validación de formatos y tamaños
 * 
 * @since 1.0.0
 * @version 1.0.0
 */

// Configuración de directorios
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');
const LOGOS_DIR = path.join(UPLOAD_BASE_DIR, 'logos');
const IMAGES_DIR = path.join(UPLOAD_BASE_DIR, 'images');

// Límites de archivos
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_FORMATS = ['image/jpeg', 'image/png', 'image/svg+xml'];
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Crea los directorios necesarios si no existen
 */
export async function ensureUploadDirectories() {
  try {
    await access(UPLOAD_BASE_DIR);
  } catch {
    await mkdir(UPLOAD_BASE_DIR, { recursive: true });
  }

  try {
    await access(LOGOS_DIR);
  } catch {
    await mkdir(LOGOS_DIR, { recursive: true });
  }

  try {
    await access(IMAGES_DIR);
  } catch {
    await mkdir(IMAGES_DIR, { recursive: true });
  }
}

/**
 * Genera un nombre único para el archivo
 */
function generateUniqueFilename(originalName: string, prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  return `${prefix}${baseName}-${timestamp}-${random}${extension}`;
}

/**
 * Configuración de Multer para logos
 */
const logoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDirectories();
    cb(null, LOGOS_DIR);
  },
  filename: (req, file, cb) => {
    const branchId = req.params.branchId;
    const filename = generateUniqueFilename(file.originalname, `branch-${branchId}-logo-`);
    cb(null, filename);
  }
});

/**
 * Configuración de Multer para imágenes generales
 */
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDirectories();
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const filename = generateUniqueFilename(file.originalname, 'image-');
    cb(null, filename);
  }
});

/**
 * Filtro para validar tipos de archivo de logo
 */
const logoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_LOGO_FORMATS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no válido. Solo se permiten JPG, PNG y SVG.'));
  }
};

/**
 * Filtro para validar tipos de archivo de imagen
 */
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_FORMATS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no válido. Solo se permiten JPG, PNG y WebP.'));
  }
};

/**
 * Middleware para subida de logos
 */
export const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: logoFileFilter,
}).single('logo');

/**
 * Middleware para subida de imágenes
 */
export const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: imageFileFilter,
}).single('image');

/**
 * Redimensiona una imagen automáticamente
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<void> {
  const {
    width = 300,
    height = 200,
    quality = 90,
    format = 'jpeg'
  } = options;

  await sharp(inputPath)
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFormat(format, { quality })
    .toFile(outputPath);
}

/**
 * Procesa y optimiza un logo subido
 */
export async function processLogo(filePath: string): Promise<{
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
  publicUrl: string;
}> {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  const optimizedPath = path.join(dir, `${basename}-optimized.webp`);
  const thumbnailPath = path.join(dir, `${basename}-thumb.webp`);
  
  // Solo procesar si no es SVG
  if (ext.toLowerCase() !== '.svg') {
    // Crear versión optimizada (max 400x300)
    await resizeImage(filePath, optimizedPath, {
      width: 400,
      height: 300,
      quality: 85,
      format: 'webp'
    });
    
    // Crear thumbnail (max 150x100)
    await resizeImage(filePath, thumbnailPath, {
      width: 150,
      height: 100,
      quality: 80,
      format: 'webp'
    });
  }
  
  // Generar URL pública
  const relativePath = path.relative(UPLOAD_BASE_DIR, filePath);
  const publicUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
  
  return {
    originalPath: filePath,
    optimizedPath: ext.toLowerCase() === '.svg' ? filePath : optimizedPath,
    thumbnailPath: ext.toLowerCase() === '.svg' ? filePath : thumbnailPath,
    publicUrl
  };
}

/**
 * Elimina un archivo del sistema
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.warn('Error al eliminar archivo:', error);
  }
}

/**
 * Limpia archivos antiguos de logos para una sede
 */
export async function cleanupOldLogos(branchId: number, keepFile?: string): Promise<void> {
  try {
    const files = await fs.promises.readdir(LOGOS_DIR);
    const branchFiles = files.filter(file => 
      file.startsWith(`branch-${branchId}-logo-`) && 
      (!keepFile || !file.includes(path.basename(keepFile, path.extname(keepFile))))
    );
    
    for (const file of branchFiles) {
      await deleteFile(path.join(LOGOS_DIR, file));
    }
  } catch (error) {
    console.warn('Error al limpiar logos antiguos:', error);
  }
}

/**
 * Valida que un archivo existe y es accesible
 */
export async function validateFileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene información de un archivo
 */
export async function getFileInfo(filePath: string): Promise<{
  size: number;
  mimeType: string;
  lastModified: Date;
} | null> {
  try {
    const stats = await fs.promises.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let mimeType = 'application/octet-stream';
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
    }
    
    return {
      size: stats.size,
      mimeType,
      lastModified: stats.mtime
    };
  } catch {
    return null;
  }
}

export default {
  uploadLogo,
  uploadImage,
  processLogo,
  resizeImage,
  deleteFile,
  cleanupOldLogos,
  validateFileExists,
  getFileInfo,
  ensureUploadDirectories
};
