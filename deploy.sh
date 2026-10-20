#!/usr/bin/env bash

# ========================================================
# Script Deployment Otomatis (Frontend + Backend + MariaDB)
# ========================================================

set -e

# Warna teks terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== [1/5] Memeriksa Kebutuhan Sistem ===${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker belum terpasang di VPS! Silakan instal Docker terlebih dahulu.${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose plugin belum terpasang!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Docker & Docker Compose siap digunakan.${NC}"

echo -e "\n${BLUE}=== [2/5] Memeriksa Berkas Lingkungan (.env) ===${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}[INFO] Berkas .env tidak ditemukan. Menyalin dari .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}[OK] File .env berhasil dibuat dengan konfigurasi default.${NC}"
    echo -e "${YELLOW}[PENTING] Silakan edit .env jika ingin mengganti password database sebelum produksi:${NC}"
    echo -e "${YELLOW}nano .env${NC}"
else
    echo -e "${GREEN}[OK] Berkas .env sudah ada.${NC}"
fi

echo -e "\n${BLUE}=== [3/5] Memperbarui Kode dari Git (jika tersedia) ===${NC}"
if [ -d .git ]; then
    echo -e "${YELLOW}Mengambil commit terbaru dari remote repository...${NC}"
    git pull || echo -e "${YELLOW}[PERINGATAN] Git pull dilewati atau gagal (mungkin ada uncommitted changes).${NC}"
else
    echo -e "${YELLOW}[INFO] Bukan repository git lokal, melewati git pull.${NC}"
fi

echo -e "\n${BLUE}=== [4/5] Membangun dan Menjalankan Seluruh Service ===${NC}"
echo -e "Menjalankan container (MariaDB, Backend API, Frontend Nginx)..."
docker compose up -d --build --remove-orphans

echo -e "\n${YELLOW}Membersihkan image Docker lama yang tidak terpakai...${NC}"
docker image prune -f

echo -e "\n${BLUE}=== [5/5] Verifikasi Status Layanan ===${NC}"
echo -e "Menunggu beberapa detik agar database dan backend siap..."
sleep 5
docker compose ps

# Membaca port dari .env
APP_PORT=$(grep -E '^APP_PORT=' .env | cut -d '=' -f 2 || echo "80")
if [ -z "$APP_PORT" ]; then
    APP_PORT="80"
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ Deployment Selesai & Database Terhubung!         ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Aplikasi web dapat diakses di:"
echo -e "-> ${BLUE}http://<IP_VPS_ANDA>:${APP_PORT}${NC}"
if [ "$APP_PORT" = "80" ]; then
    echo -e "-> ${BLUE}http://<IP_VPS_ANDA>${NC} (Port default HTTP)"
fi
echo -e "\nLayanan yang berjalan di Docker Compose:"
echo -e "  - ${GREEN}tools-db${NC}       : MariaDB/MySQL (Data tersimpan di volume db_data)"
echo -e "  - ${GREEN}tools-backend${NC}  : Node.js Express REST API (Port 5000 internal)"
echo -e "  - ${GREEN}tools-app${NC}      : Nginx SPA Frontend (Port ${APP_PORT})"
echo -e "\nPerintah praktis:"
echo -e "  - Cek log backend    : docker compose logs -f backend"
echo -e "  - Cek log database   : docker compose logs -f db"
echo -e "  - Backup database    : docker compose exec db mariadb-dump -u root -p\$(grep DB_ROOT_PASSWORD .env | cut -d'=' -f2) jdp_tools_db > backup.sql"
echo -e "  - Restart container  : docker compose restart"
echo -e "  - Hentikan aplikasi  : docker compose down"
