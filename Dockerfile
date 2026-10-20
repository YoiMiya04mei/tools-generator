# ==========================================
# Multi-stage Dockerfile for React Vite App
# ==========================================

# --- Tahap 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Salin package files dan install dependencies terlebih dahulu (memanfaatkan layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Salin seluruh source code proyek
COPY . .

# Build aplikasi untuk production (menghasilkan folder dist)
RUN npm run build

# --- Tahap 2: Production Server (Nginx) ---
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Hapus konfigurasi default Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Salin konfigurasi Nginx kustom yang sudah dioptimasi untuk SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari tahap builder ke direktori static Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Port yang diekspos oleh container
EXPOSE 80

# Healthcheck untuk memastikan Nginx berjalan dengan normal
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

# Jalankan Nginx di foreground
CMD ["nginx", "-g", "daemon off;"]
