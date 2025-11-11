# 🚀 Guía de Despliegue VitalCare Frontend en AWS EC2

> **Guía completa para desplegar VitalCare Frontend en Amazon EC2 con Ubuntu 24.04.3 LTS, Nginx y Node.js 22**

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de la Instancia EC2](#configuración-de-la-instancia-ec2)
3. [Conexión a la Instancia](#conexión-a-la-instancia)
4. [Configuración Inicial del Servidor](#configuración-inicial-del-servidor)
5. [Instalación de Node.js 22](#instalación-de-nodejs-22)
6. [Instalación y Configuración de Nginx](#instalación-y-configuración-de-nginx)
7. [Clonación y Configuración del Proyecto](#clonación-y-configuración-del-proyecto)
8. [Build del Proyecto](#build-del-proyecto)
9. [Configuración de Nginx para el Proyecto](#configuración-de-nginx-para-el-proyecto)
10. [Configuración de SSL con Let's Encrypt](#configuración-de-ssl-con-lets-encrypt)
11. [Optimizaciones y Configuraciones Avanzadas](#optimizaciones-y-configuraciones-avanzadas)
12. [Mantenimiento y Actualizaciones](#mantenimiento-y-actualizaciones)
13. [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

### Stack Tecnológico
- ✅ **React 19** - Framework UI más reciente
- ✅ **TypeScript 5.9** - Type safety completo
- ✅ **Vite 7** - Build tool de última generación
- ✅ **Tailwind CSS 4** - Framework de estilos moderno
- ✅ **React Query 5** - Estado del servidor optimizado
- ✅ **React Router 7** - Routing moderno
- ✅ **Vitest 3** - Testing ultrarrápido

### Información del Proyecto
- **Dominio**: `care.vital-app.com`
- **Repositorio**: `https://github.com/JuanNorena/VitalCare.git`
- **Sistema Operativo**: Ubuntu 24.04.3 LTS (Noble Numbat)
- **Servidor Web**: Nginx
- **Runtime**: Node.js 22

### Lo que necesitarás
- [ ] Cuenta de AWS con permisos para crear instancias EC2
- [ ] Par de claves SSH (.pem) para acceso a la instancia
- [ ] Dominio configurado (care.vital-app.com)
- [ ] Acceso DNS para configurar el dominio
- [ ] Cliente SSH (Terminal en Linux/Mac, PuTTY en Windows)

---

## 🖥️ Configuración de la Instancia EC2

### Paso 1: Crear Instancia EC2

1. **Inicia sesión en AWS Console**
   - Ve a: https://console.aws.amazon.com/ec2/

2. **Lanza una nueva instancia**
   ```
   Nombre: VitalCare-Frontend-Production
   ```

3. **Selecciona la AMI (Amazon Machine Image)**
   ```
   Sistema Operativo: Ubuntu
   Versión: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
   Arquitectura: 64-bit (x86)
   ```

4. **Selecciona el tipo de instancia**
   ```
   Recomendado para producción:
   - t3.small (2 vCPU, 2 GB RAM) - Para tráfico bajo/medio
   - t3.medium (2 vCPU, 4 GB RAM) - Para tráfico medio/alto
   
   Desarrollo/Testing:
   - t2.micro (1 vCPU, 1 GB RAM) - Capa gratuita elegible
   ```

5. **Configuración de Par de Claves**
   ```
   - Crear nuevo par de claves o usar existente
   - Nombre: vitalcare-frontend-key
   - Tipo: RSA
   - Formato: .pem (para SSH en Linux/Mac)
   
   ⚠️ IMPORTANTE: Descarga y guarda el archivo .pem en lugar seguro
   ```

6. **Configuración de Red**
   ```
   VPC: Default (o tu VPC personalizada)
   Subnet: Default
   Auto-assign Public IP: Enable
   ```

7. **Configuración de Firewall (Security Group)**
   ```
   Nombre: VitalCare-Frontend-SG
   
   Reglas de entrada (Inbound Rules):
   ┌─────────┬──────┬──────────────┬─────────────────────┐
   │ Tipo    │ Port │ Protocolo    │ Origen              │
   ├─────────┼──────┼──────────────┼─────────────────────┤
   │ SSH     │ 22   │ TCP          │ Mi IP / 0.0.0.0/0   │
   │ HTTP    │ 80   │ TCP          │ 0.0.0.0/0           │
   │ HTTPS   │ 443  │ TCP          │ 0.0.0.0/0           │
   └─────────┴──────┴──────────────┴─────────────────────┘
   ```

8. **Configuración de Almacenamiento**
   ```
   Tamaño: 20-30 GB (SSD gp3)
   - Sistema: ~8 GB
   - Node.js y dependencias: ~5 GB
   - Proyecto y builds: ~3-5 GB
   - Logs y temporales: ~2-4 GB
   - Espacio libre: ~5 GB
   ```

9. **Revisa y Lanza**
   - Verifica toda la configuración
   - Haz clic en "Launch Instance"
   - Espera a que el estado sea "Running" (2-3 minutos)

### Paso 2: Configurar DNS

1. **Obtén la IP Elástica (Elastic IP)**
   ```bash
   # En AWS Console > EC2 > Elastic IPs
   - Allocate Elastic IP address
   - Associate Elastic IP address con tu instancia
   ```

2. **Configura el registro DNS**
   ```
   En tu proveedor DNS (Route 53, Cloudflare, etc.):
   
   Tipo: A Record
   Nombre: care.vital-app.com
   Valor: [Tu Elastic IP]
   TTL: 300
   
   Opcional (www):
   Tipo: CNAME
   Nombre: www.care.vital-app.com
   Valor: care.vital-app.com
   TTL: 300
   ```

---

## 🔐 Conexión a la Instancia

### En Linux/Mac

```bash
# 1. Configura permisos del archivo .pem
chmod 400 ~/path/to/vitalcare-frontend-key.pem

# 2. Conéctate a la instancia
ssh -i ~/path/to/vitalcare-frontend-key.pem ubuntu@care.vital-app.com
# O usando la IP directamente:
ssh -i ~/path/to/vitalcare-frontend-key.pem ubuntu@[ELASTIC_IP]
```

### En Windows (PowerShell)

```powershell
# Usando OpenSSH (Windows 10+)
ssh -i C:\path\to\vitalcare-frontend-key.pem ubuntu@care.vital-app.com

# O usando PuTTY:
# 1. Convierte .pem a .ppk usando PuTTYgen
# 2. Usa PuTTY con el archivo .ppk
```

### Verificación de Conexión

```bash
# Una vez conectado, deberías ver:
ubuntu@ip-xxx-xxx-xxx-xxx:~$

# Verifica la versión del sistema
lsb_release -a
# Debería mostrar: Ubuntu 24.04.3 LTS
```

---

## ⚙️ Configuración Inicial del Servidor

### Paso 1: Actualizar el Sistema

```bash
# Actualiza la lista de paquetes
sudo apt update

# Actualiza todos los paquetes instalados
sudo apt upgrade -y

# Limpia paquetes innecesarios
sudo apt autoremove -y
sudo apt autoclean
```

### Paso 2: Instalar Herramientas Esenciales

```bash
# Instala build-essential y herramientas de compilación
sudo apt install -y build-essential curl wget git vim unzip

# Verifica las instalaciones
git --version
curl --version
```

### Paso 3: Configurar Firewall UFW (Opcional pero Recomendado)

```bash
# Instala UFW si no está instalado
sudo apt install -y ufw

# Permite SSH (IMPORTANTE: hazlo primero para no perder conexión)
sudo ufw allow 22/tcp

# Permite HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilita el firewall
sudo ufw enable

# Verifica el estado
sudo ufw status
```

### Paso 4: Configurar Zona Horaria

```bash
# Configura la zona horaria (ejemplo: Colombia)
sudo timedatectl set-timezone America/Bogota

# Verifica la configuración
timedatectl
```

---

## 📦 Instalación de Node.js 22

### Método 1: Usando NodeSource (Recomendado)

```bash
# Descarga e instala el script de configuración de NodeSource para Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Instala Node.js 22
sudo apt install -y nodejs

# Verifica la instalación
node --version
# Debería mostrar: v22.x.x

npm --version
# Debería mostrar: 10.x.x o superior
```

### Método 2: Usando NVM (Alternativo)

```bash
# Instala NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carga NVM en la sesión actual
source ~/.bashrc

# Instala Node.js 22
nvm install 22

# Usa Node.js 22 como versión por defecto
nvm alias default 22
nvm use 22

# Verifica
node --version
npm --version
```

### Configuración Global de npm

```bash
# Configura npm para permisos globales sin sudo
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Agrega al PATH (añade al final de ~/.bashrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Instala PM2 globalmente (gestor de procesos)
npm install -g pm2

# Verifica
pm2 --version
```

---

## 🌐 Instalación y Configuración de Nginx

### Paso 1: Instalar Nginx

```bash
# Instala Nginx
sudo apt install -y nginx

# Verifica la instalación
nginx -v
# Debería mostrar: nginx version: nginx/1.24.x

# Verifica que Nginx esté corriendo
sudo systemctl status nginx

# Si no está corriendo, inícialo
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Paso 2: Configuración Básica de Nginx

```bash
# Detén Nginx temporalmente
sudo systemctl stop nginx

# Elimina el sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verifica la configuración de Nginx
sudo nginx -t

# Inicia Nginx
sudo systemctl start nginx
```

### Paso 3: Verificar Nginx

```bash
# Accede a tu IP pública en el navegador
# http://[ELASTIC_IP]
# Deberías ver la página de bienvenida de Nginx
```

---

## 📥 Clonación y Configuración del Proyecto

### Paso 1: Crear Directorio del Proyecto

```bash
# Crea el directorio para aplicaciones
sudo mkdir -p /var/www

# Cambia el propietario a ubuntu
sudo chown -R $USER:$USER /var/www

# Navega al directorio
cd /var/www
```

### Paso 2: Clonar el Repositorio

```bash
# Clona el repositorio del frontend
git clone https://github.com/JuanNorena/VitalCare.git vitalcare-frontend

# Navega al directorio del proyecto
cd vitalcare-frontend/VitalCare_front

# Verifica que estés en el directorio correcto
pwd
# Debería mostrar: /var/www/vitalcare-frontend/VitalCare_front

# Lista los archivos
ls -la
# Deberías ver: package.json, vite.config.ts, src/, etc.
```

### Paso 3: Configurar Variables de Entorno

```bash
# Crea el archivo de variables de entorno
nano .env.production

# Agrega las siguientes variables:
```

```env
# .env.production
VITE_API_BASE_URL=https://vitalcare-back.onrender.com
VITE_ENVIRONMENT=production
```

```bash
# Guarda el archivo (Ctrl+O, Enter, Ctrl+X)

# Crea también .env para desarrollo local (opcional)
nano .env

# Contenido:
VITE_API_BASE_URL=https://vitalcare-back.onrender.com
VITE_ENVIRONMENT=development
```

### Paso 4: Instalar Dependencias

```bash
# Instala todas las dependencias del proyecto
npm install

# Esto instalará:
# - React 19.1.1
# - TypeScript 5.9.2
# - Vite 7.1.4
# - Tailwind CSS 4.1.13
# - React Query 5.87.1
# - React Router 7.8.2
# - Y todas las demás dependencias

# Verifica que node_modules se haya creado
ls -la
# Deberías ver la carpeta node_modules/
```

---

## 🏗️ Build del Proyecto

### Paso 1: Ejecutar Build de Producción

```bash
# Asegúrate de estar en el directorio del proyecto
cd /var/www/vitalcare-frontend/VitalCare_front

# Ejecuta el build de producción
npm run build

# Este comando ejecuta:
# 1. TypeScript compiler (tsc)
# 2. Vite build con optimizaciones de producción
# 3. Tree shaking y code splitting
# 4. Minificación de JS/CSS
# 5. Generación de source maps

# El proceso tomará 1-3 minutos dependiendo de la instancia

# Verifica que el build se haya completado exitosamente
ls -la dist/

# Deberías ver:
# - index.html
# - assets/ (con archivos .js y .css optimizados)
# - vite.svg
```

### Paso 2: Verificar el Build

```bash
# Verifica el tamaño de los archivos
du -sh dist/
# Debería mostrar algo como: 2-5 MB

# Lista los archivos del build
tree dist/ -L 2
# O si tree no está instalado:
find dist/ -type f

# Verifica que no haya errores en los logs
cat dist/index.html | head -20
```

---

## 🔧 Configuración de Nginx para el Proyecto

### Paso 1: Crear Configuración del Sitio

```bash
# Crea el archivo de configuración para VitalCare
sudo nano /etc/nginx/sites-available/vitalcare-frontend

# Pega la siguiente configuración:
```

```nginx
# /etc/nginx/sites-available/vitalcare-frontend

# Configuración del servidor VitalCare Frontend
server {
    listen 80;
    listen [::]:80;
    
    server_name care.vital-app.com www.care.vital-app.com;
    
    # Directorio raíz del proyecto
    root /var/www/vitalcare-frontend/VitalCare_front/dist;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/vitalcare-access.log;
    error_log /var/log/nginx/vitalcare-error.log;
    
    # Configuración de archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
    
    # Caché para assets estáticos (JavaScript, CSS, imágenes)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Desactivar caché para index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
    
    # Proxy para API (opcional, si backend está en otro servidor)
    location /api/ {
        proxy_pass https://vitalcare-back.onrender.com/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
}
```

### Paso 2: Habilitar el Sitio

```bash
# Crea un enlace simbólico en sites-enabled
sudo ln -s /etc/nginx/sites-available/vitalcare-frontend /etc/nginx/sites-enabled/

# Verifica que el enlace se haya creado
ls -la /etc/nginx/sites-enabled/

# Verifica la configuración de Nginx
sudo nginx -t

# Deberías ver:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Paso 3: Reiniciar Nginx

```bash
# Reinicia Nginx para aplicar los cambios
sudo systemctl restart nginx

# Verifica el estado
sudo systemctl status nginx

# Verifica los logs por si hay errores
sudo tail -f /var/log/nginx/vitalcare-error.log
# Presiona Ctrl+C para salir
```

### Paso 4: Verificar el Despliegue

```bash
# Accede a tu sitio en el navegador
# http://care.vital-app.com

# Deberías ver la aplicación VitalCare funcionando

# Verifica los logs de acceso
sudo tail -f /var/log/nginx/vitalcare-access.log
```

---

## 🔒 Configuración de SSL con Let's Encrypt

### Paso 1: Instalar Certbot

```bash
# Instala Certbot y el plugin de Nginx
sudo apt install -y certbot python3-certbot-nginx

# Verifica la instalación
certbot --version
```

### Paso 2: Obtener Certificado SSL

```bash
# Obtén el certificado SSL para tu dominio
sudo certbot --nginx -d care.vital-app.com -d www.care.vital-app.com

# Durante el proceso, se te pedirá:
# 1. Email para notificaciones importantes
# 2. Aceptar los términos de servicio
# 3. Compartir email con EFF (opcional)
# 4. Redirigir HTTP a HTTPS (selecciona: 2 - Redirect)

# El certificado se instalará y configurará automáticamente en Nginx
```

### Paso 3: Verificar Configuración SSL

```bash
# Verifica la configuración actualizada de Nginx
sudo nano /etc/nginx/sites-available/vitalcare-frontend

# Certbot habrá añadido configuración SSL automáticamente
# Deberías ver bloques adicionales con:
# - listen 443 ssl
# - ssl_certificate
# - ssl_certificate_key
# - Redirección de HTTP a HTTPS

# Verifica la sintaxis
sudo nginx -t

# Reinicia Nginx
sudo systemctl restart nginx
```

### Paso 4: Verificar Certificado SSL

```bash
# Accede a tu sitio con HTTPS
# https://care.vital-app.com

# Verifica el certificado en el navegador
# Deberías ver el candado verde

# Verifica información del certificado
sudo certbot certificates

# Prueba la renovación automática
sudo certbot renew --dry-run
```

### Paso 5: Configurar Renovación Automática

```bash
# Certbot crea automáticamente un cron job para renovación
# Verifica que esté configurado
sudo systemctl status certbot.timer

# Los certificados se renovarán automáticamente cada 60 días
# Let's Encrypt emite certificados válidos por 90 días

# Verifica el timer de renovación
sudo systemctl list-timers | grep certbot
```

---

## ⚡ Optimizaciones y Configuraciones Avanzadas

### 1. Configuración Avanzada de Nginx

```bash
# Edita la configuración principal de Nginx
sudo nano /etc/nginx/nginx.conf
```

```nginx
# Optimizaciones en /etc/nginx/nginx.conf

http {
    # ... configuración existente ...
    
    # Aumenta los límites de buffer
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;
    
    # Timeouts optimizados
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 65;
    send_timeout 10;
    
    # Gzip optimizado
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json 
               application/font-woff application/font-woff2 
               font/opentype application/vnd.ms-fontobject 
               image/svg+xml;
    
    # Caché de archivos abiertos
    open_file_cache max=2000 inactive=20s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

### 2. Configuración de Headers de Seguridad Mejorados

```bash
# Edita la configuración del sitio
sudo nano /etc/nginx/sites-available/vitalcare-frontend
```

```nginx
# Añade estos headers dentro del bloque server (puerto 443)

# Content Security Policy
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.wompi.co https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://vitalcare-back.onrender.com https://checkout.wompi.co; frame-src 'self' https://checkout.wompi.co;" always;

# Strict Transport Security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Permissions Policy
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
```

### 3. Configurar Logs Rotativos

```bash
# Nginx usa logrotate automáticamente
# Verifica la configuración
cat /etc/logrotate.d/nginx

# Personaliza si es necesario
sudo nano /etc/logrotate.d/nginx
```

```conf
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
```

### 4. Monitoreo con PM2 (Opcional para desarrollo)

```bash
# Si necesitas servir con Node.js en lugar de Nginx
# Útil para debugging

# Instala PM2 globalmente
npm install -g pm2

# Crea un servidor simple con preview de Vite
cd /var/www/vitalcare-frontend/VitalCare_front

# Crea un archivo de configuración PM2
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'vitalcare-frontend',
    script: 'npm',
    args: 'run preview',
    cwd: '/var/www/vitalcare-frontend/VitalCare_front',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4173
    }
  }]
}
```

```bash
# Inicia con PM2
pm2 start ecosystem.config.js

# Configura PM2 para iniciar al arranque del sistema
pm2 startup
pm2 save

# Comandos útiles de PM2
pm2 list           # Lista procesos
pm2 logs           # Ver logs
pm2 restart all    # Reiniciar
pm2 stop all       # Detener
pm2 delete all     # Eliminar
```

### 5. Configurar Fail2Ban (Protección contra ataques)

```bash
# Instala Fail2Ban
sudo apt install -y fail2ban

# Crea configuración personalizada
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
```

```bash
# Reinicia Fail2Ban
sudo systemctl restart fail2ban

# Verifica el estado
sudo fail2ban-client status
```

---

## 🔄 Mantenimiento y Actualizaciones

### Script de Actualización Automática

```bash
# Crea un script para actualizar la aplicación
nano ~/update-vitalcare.sh
```

```bash
#!/bin/bash

# Script de actualización VitalCare Frontend
# Autor: VitalCare Team
# Fecha: 2024

echo "🚀 Iniciando actualización de VitalCare Frontend..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="/var/www/vitalcare-frontend/VitalCare_front"

# Navega al directorio
cd $PROJECT_DIR || exit

echo -e "${YELLOW}📥 Obteniendo últimos cambios del repositorio...${NC}"
git fetch origin

# Verifica si hay cambios
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL = $REMOTE ]; then
    echo -e "${GREEN}✅ Ya estás en la última versión${NC}"
    exit 0
fi

echo -e "${YELLOW}📦 Actualizando código...${NC}"
git pull origin main

echo -e "${YELLOW}📦 Instalando nuevas dependencias...${NC}"
npm install

echo -e "${YELLOW}🏗️ Compilando nueva versión...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completado exitosamente${NC}"
    
    echo -e "${YELLOW}🔄 Reiniciando Nginx...${NC}"
    sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Actualización completada exitosamente${NC}"
    echo -e "${GREEN}🌐 La aplicación está disponible en: https://care.vital-app.com${NC}"
else
    echo -e "${RED}❌ Error en el build. Revisa los logs.${NC}"
    exit 1
fi

# Limpieza
echo -e "${YELLOW}🧹 Limpiando archivos temporales...${NC}"
npm cache clean --force

echo -e "${GREEN}✨ Proceso completado${NC}"
```

```bash
# Dar permisos de ejecución
chmod +x ~/update-vitalcare.sh

# Ejecutar cuando necesites actualizar
~/update-vitalcare.sh
```

### Configurar Actualizaciones Automáticas del Sistema

```bash
# Instala unattended-upgrades
sudo apt install -y unattended-upgrades

# Configura actualizaciones automáticas
sudo dpkg-reconfigure -plow unattended-upgrades

# Edita la configuración
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Habilita actualizaciones de seguridad
# Descomenta las líneas necesarias
```

### Monitoreo de Recursos

```bash
# Instala htop para monitoreo en tiempo real
sudo apt install -y htop

# Usa htop para ver recursos
htop

# Verifica uso de disco
df -h

# Verifica uso de memoria
free -h

# Verifica procesos de Nginx
ps aux | grep nginx

# Verifica conexiones activas
netstat -tuln | grep :80
netstat -tuln | grep :443
```

### Backup Automatizado

```bash
# Crea script de backup
nano ~/backup-vitalcare.sh
```

```bash
#!/bin/bash

# Script de backup VitalCare Frontend

BACKUP_DIR="/home/ubuntu/backups"
PROJECT_DIR="/var/www/vitalcare-frontend"
DATE=$(date +%Y%m%d_%H%M%S)

# Crea directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Crea backup del proyecto
echo "📦 Creando backup..."
tar -czf $BACKUP_DIR/vitalcare-frontend-$DATE.tar.gz -C /var/www vitalcare-frontend

# Mantén solo los últimos 7 backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -I {} rm -- {}

echo "✅ Backup completado: vitalcare-frontend-$DATE.tar.gz"
```

```bash
# Dar permisos
chmod +x ~/backup-vitalcare.sh

# Configurar cron para backups diarios
crontab -e

# Añade esta línea (backup diario a las 2 AM)
0 2 * * * /home/ubuntu/backup-vitalcare.sh >> /home/ubuntu/backup.log 2>&1
```

---

## 🔍 Troubleshooting

### Problema: Nginx no inicia

```bash
# Verifica el estado
sudo systemctl status nginx

# Revisa los logs de error
sudo tail -50 /var/log/nginx/error.log

# Verifica la sintaxis de configuración
sudo nginx -t

# Revisa permisos
ls -la /var/www/vitalcare-frontend/VitalCare_front/dist/

# Los permisos deberían ser:
# drwxr-xr-x para directorios
# -rw-r--r-- para archivos
```

### Problema: Sitio no carga (502 Bad Gateway)

```bash
# Verifica que el directorio dist existe
ls -la /var/www/vitalcare-frontend/VitalCare_front/dist/

# Si no existe, ejecuta el build
cd /var/www/vitalcare-frontend/VitalCare_front
npm run build

# Verifica permisos
sudo chown -R www-data:www-data /var/www/vitalcare-frontend/VitalCare_front/dist/

# Reinicia Nginx
sudo systemctl restart nginx
```

### Problema: SSL no funciona

```bash
# Verifica el certificado
sudo certbot certificates

# Renueva el certificado manualmente
sudo certbot renew --force-renewal

# Verifica la configuración SSL en Nginx
sudo nano /etc/nginx/sites-available/vitalcare-frontend

# Reinicia Nginx
sudo systemctl restart nginx
```

### Problema: Aplicación muestra pantalla blanca

```bash
# Verifica que index.html existe
cat /var/www/vitalcare-frontend/VitalCare_front/dist/index.html

# Verifica los logs del navegador (F12 > Console)
# Busca errores de CORS o de carga de assets

# Verifica la configuración de base path en vite.config.ts
cat /var/www/vitalcare-frontend/VitalCare_front/vite.config.ts

# Reconstruye el proyecto
cd /var/www/vitalcare-frontend/VitalCare_front
rm -rf dist/
npm run build
```

### Problema: Error en npm install

```bash
# Limpia caché de npm
npm cache clean --force

# Elimina node_modules y reinstala
rm -rf node_modules package-lock.json
npm install

# Si persiste, verifica la versión de Node.js
node --version
# Debe ser v22.x.x

# Si no es la correcta, reinstala Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Problema: Build falla por falta de memoria

```bash
# Verifica memoria disponible
free -h

# Si es insuficiente (< 1GB libre), crea swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hace permanente el swap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Intenta el build nuevamente
npm run build
```

### Problema: Dominio no resuelve

```bash
# Verifica la configuración DNS
nslookup care.vital-app.com

# Debería mostrar tu Elastic IP

# Si no resuelve, verifica:
# 1. Configuración DNS en tu proveedor
# 2. Propagación DNS (puede tomar hasta 48 horas)
# 3. Elastic IP asociada correctamente

# Prueba con la IP directamente
curl http://[TU_ELASTIC_IP]
```

### Problema: API no responde (CORS)

```bash
# Verifica la configuración del proxy en Nginx
sudo nano /etc/nginx/sites-available/vitalcare-frontend

# Asegúrate que la sección location /api/ esté correcta
# Verifica que el backend esté corriendo
curl https://vitalcare-back.onrender.com/api/health

# Verifica los logs de Nginx
sudo tail -f /var/log/nginx/vitalcare-error.log
```

---

## 📊 Checklist de Verificación Post-Despliegue

### Funcionalidad

- [ ] La aplicación carga correctamente en `https://care.vital-app.com`
- [ ] HTTP redirige automáticamente a HTTPS
- [ ] Todas las páginas son accesibles (login, register, dashboard, etc.)
- [ ] Las rutas protegidas funcionan correctamente
- [ ] El sistema de autenticación funciona
- [ ] Las llamadas a la API backend funcionan
- [ ] Los modales y componentes interactivos funcionan
- [ ] El modo oscuro se activa correctamente
- [ ] La aplicación es responsiva en móvil y tablet

### Seguridad

- [ ] Certificado SSL instalado y válido
- [ ] Headers de seguridad configurados
- [ ] Firewall UFW activo con reglas correctas
- [ ] SSH configurado con par de claves (no password)
- [ ] Fail2Ban instalado y activo
- [ ] Actualizaciones automáticas de seguridad habilitadas

### Performance

- [ ] Gzip compression activado
- [ ] Caché de assets configurado
- [ ] Tiempo de carga < 3 segundos
- [ ] Lighthouse score > 90
- [ ] Assets optimizados y minificados

### Monitoreo

- [ ] Logs de Nginx configurados
- [ ] Logrotate configurado
- [ ] Backup automatizado funcionando
- [ ] Script de actualización creado

---

## 🎉 ¡Despliegue Completado!

Tu aplicación **VitalCare Frontend** está ahora desplegada y funcionando en:

🌐 **URL**: https://care.vital-app.com

### Próximos Pasos Recomendados

1. **Configurar Monitoreo**
   - Instalar herramientas como New Relic, Datadog o configurar CloudWatch
   - Configurar alertas para downtime y errores

2. **Optimizar Performance**
   - Configurar CDN (CloudFront, Cloudflare)
   - Implementar caché de API
   - Optimizar imágenes con WebP

3. **Backup y Disaster Recovery**
   - Configurar snapshots automáticos de EC2
   - Implementar backup en S3
   - Documentar proceso de recuperación

4. **CI/CD**
   - Configurar GitHub Actions para despliegues automáticos
   - Implementar tests automáticos pre-deploy
   - Configurar ambientes staging/production

5. **Seguridad Avanzada**
   - Implementar WAF (Web Application Firewall)
   - Configurar rate limiting
   - Auditoría de seguridad regular

---

## 📚 Referencias y Recursos

- **Documentación de AWS EC2**: https://docs.aws.amazon.com/ec2/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Node.js Documentation**: https://nodejs.org/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **React Production Build**: https://react.dev/learn/start-a-new-react-project

---

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs: `sudo tail -f /var/log/nginx/vitalcare-error.log`
2. Verifica la configuración: `sudo nginx -t`
3. Consulta la sección de Troubleshooting
4. Contacta al equipo de desarrollo

---

**Última actualización**: Noviembre 2024
**Versión del documento**: 1.0.0
**Autor**: VitalCare Team

---

¡Feliz despliegue! 🚀
