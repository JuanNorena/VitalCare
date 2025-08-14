/**
 * @fileoverview Script para comparar archivos de traducción y sincronizar llaves entre idiomas
 * @description Este script compara los archivos de traducción en español e inglés,
 * identifica llaves faltantes y genera archivos con las traducciones pendientes.
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Función para obtener todas las rutas de llaves de un objeto JSON anidado
 * @description Recorre recursivamente un objeto JSON y extrae todas las rutas de llaves
 * en formato dot notation (ej: "auth.validation.required")
 * @param {Object} obj - El objeto JSON a procesar
 * @param {string} [prefix=''] - Prefijo para las rutas de llaves
 * @returns {Set<string>} Conjunto de todas las rutas de llaves encontradas
 * @example
 * // Para un objeto { auth: { login: "text", validation: { required: "text" } } }
 * // Retorna Set(["auth", "auth.login", "auth.validation", "auth.validation.required"])
 */
function getKeyPaths(obj, prefix = '') {
  const paths = new Set();
  
  /**
   * Función interna para recorrer recursivamente el objeto
   * @param {any} current - El valor actual siendo procesado
   * @param {string} currentPath - La ruta actual de llaves
   */
  function traverse(current, currentPath) {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      for (const [key, value] of Object.entries(current)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        paths.add(newPath);
        traverse(value, newPath);
      }
    }
  }
  
  traverse(obj, prefix);
  return paths;
}

/**
 * Rutas de los archivos de traducción
 * @type {string}
 */
const esPath = path.join(__dirname, 'client/src/i18n/locales/es.json');
/** @type {string} */
const enPath = path.join(__dirname, 'client/src/i18n/locales/en.json');

/**
 * Bloque principal de ejecución del script
 * @description Lee los archivos de traducción, compara las llaves y genera reportes
 */
try {
  // Leer y parsear los archivos JSON
  /** @type {Object} Contenido del archivo de traducciones en español */
  const esContent = JSON.parse(fs.readFileSync(esPath, 'utf8'));
  /** @type {Object} Contenido del archivo de traducciones en inglés */
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  
  // Obtener todas las llaves de ambos archivos
  /** @type {Set<string>} Conjunto de llaves del archivo español */
  const esKeys = getKeyPaths(esContent);
  /** @type {Set<string>} Conjunto de llaves del archivo inglés */
  const enKeys = getKeyPaths(enContent);
  
  // Encontrar llaves que están en español pero no en inglés
  /** @type {string[]} Array de llaves faltantes en el archivo inglés */
  const missingInEnglish = [...esKeys].filter(key => !enKeys.has(key));
  
  // Encontrar llaves que están en inglés pero no en español
  /** @type {string[]} Array de llaves faltantes en el archivo español */
  const missingInSpanish = [...enKeys].filter(key => !esKeys.has(key));
  
  // Mostrar estadísticas generales
  console.log('=== COMPARACIÓN DE TRADUCCIONES ===\n');
  
  console.log(`Total de llaves en español: ${esKeys.size}`);
  console.log(`Total de llaves en inglés: ${enKeys.size}`);
  console.log(`Diferencia: ${esKeys.size - enKeys.size}\n`);
  
  /**
   * Procesar y mostrar llaves faltantes en inglés
   */
  if (missingInEnglish.length > 0) {
    console.log('🔴 LLAVES FALTANTES EN INGLÉS:');
    console.log(`Total: ${missingInEnglish.length} llaves\n`);
    
    /**
     * Agrupar llaves faltantes por sección principal
     * @type {Object<string, string[]>}
     */
    const groupedMissing = {};
    missingInEnglish.forEach(key => {
      const section = key.split('.')[0];
      if (!groupedMissing[section]) {
        groupedMissing[section] = [];
      }
      groupedMissing[section].push(key);
    });
    
    // Mostrar llaves agrupadas por sección
    Object.entries(groupedMissing).forEach(([section, keys]) => {
      console.log(`📋 Sección "${section}" (${keys.length} llaves):`);
      keys.sort().forEach(key => console.log(`  - ${key}`));
      console.log('');
    });
  } else {
    console.log('✅ No hay llaves faltantes en inglés');
  }
  
  /**
   * Procesar y mostrar llaves extra en inglés (no están en español)
   */
  if (missingInSpanish.length > 0) {
    console.log('\n🟡 LLAVES EXTRA EN INGLÉS (no están en español):');
    console.log(`Total: ${missingInSpanish.length} llaves\n`);
    
    /**
     * Agrupar llaves extra por sección principal
     * @type {Object<string, string[]>}
     */
    const groupedExtra = {};
    missingInSpanish.forEach(key => {
      const section = key.split('.')[0];
      if (!groupedExtra[section]) {
        groupedExtra[section] = [];
      }
      groupedExtra[section].push(key);
    });
    
    // Mostrar llaves agrupadas por sección
    Object.entries(groupedExtra).forEach(([section, keys]) => {
      console.log(`📋 Sección "${section}" (${keys.length} llaves):`);
      keys.sort().forEach(key => console.log(`  - ${key}`));
      console.log('');
    });
  }
  
  /**
   * Función para obtener el valor de una llave anidada en un objeto
   * @param {Object} obj - El objeto del cual extraer el valor
   * @param {string} path - La ruta de la llave en formato dot notation
   * @returns {any} El valor encontrado en la ruta especificada
   * @example
   * // getNestedValue({ auth: { login: "text" } }, "auth.login") => "text"
   */
  /**
   * Función para obtener el valor de una llave anidada en un objeto
   * @param {Object} obj - El objeto del cual extraer el valor
   * @param {string} path - La ruta de la llave en formato dot notation
   * @returns {any} El valor encontrado en la ruta especificada
   * @example
   * // getNestedValue({ auth: { login: "text" } }, "auth.login") => "text"
   */
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Generar archivo JSON con las traducciones faltantes
   * @description Crea un archivo con las traducciones que faltan en inglés,
   * marcadas con el prefijo [PENDING] para facilitar su identificación
   */
  if (missingInEnglish.length > 0) {
    /** @type {Object} Objeto que contendrá las traducciones faltantes */
    const missingTranslations = {};
    
    // Procesar cada llave faltante
    missingInEnglish.forEach(keyPath => {
      const value = getNestedValue(esContent, keyPath);
      if (value && typeof value === 'string') {
        /**
         * Crear la estructura anidada en el objeto resultado
         * @type {string[]} Array de llaves para navegar la estructura
         */
        const keys = keyPath.split('.');
        let current = missingTranslations;
        
        // Construir la estructura anidada
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Asignar el valor con el prefijo [PENDING]
        current[keys[keys.length - 1]] = `[PENDING] ${value}`;
      }
    });
    
    /**
     * Guardar archivo con traducciones faltantes
     * @type {string} Ruta del archivo de salida
     */
    const outputPath = path.join(__dirname, 'missing-translations-en.json');
    fs.writeFileSync(outputPath, JSON.stringify(missingTranslations, null, 2), 'utf8');
    console.log(`\n📄 Archivo generado: missing-translations-en.json`);
    console.log(`   Contiene las ${missingInEnglish.length} traducciones faltantes marcadas con [PENDING]`);
  }
  
} catch (error) {
  /**
   * Manejo de errores durante la ejecución
   * @param {Error} error - El error capturado
   */
  console.error('Error al leer o procesar los archivos:', error.message);
}
