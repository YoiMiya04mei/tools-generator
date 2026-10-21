# Panduan Deployment ke VPS Ubuntu (dengan Database MariaDB / MySQL)

Dokumen ini memuat panduan lengkap baris per baris untuk men-deploy aplikasi **JDP Tools** ke **VPS Ubuntu (20.04 / 22.04 / 24.04 LTS)** dengan arsitektur 3-tier: **Frontend (Nginx) + Backend (Node.js REST API) + Database (MariaDB/MySQL)**.

Dengan arsitektur ini, **seluruh staf/pengguna di laptop maupun smartphone dapat melihat, membuat, dan mengedit data dokumen (Berita Acara, Surat Tugas, RFO, Template, dan Akun Pengguna) yang sama secara terpusat**.

---

## Arsitektur Sistem di VPS

```text
[ Browser Klien / Staf ]
         │
         ▼ (HTTP Port 80 / 443)
┌────────────────────────────────────────┐
│  Container Frontend (Nginx Alpine)     │
│  - Menyajikan aset React SPA           │
│  - Proxy /api/* ke container backend   │
└───────────────────┬────────────────────┘
                    │ (Internal network)
                    ▼ (Port 5000)
┌────────────────────────────────────────┐
│  Container Backend (Node.js Express)   │
│  - Endpoint REST API Storage & Health  │
│  - Pool koneksi & migrasi database     │
└───────────────────┬────────────────────┘
                    │ (Internal network)
                    ▼ (Port 3306)
┌────────────────────────────────────────┐
│  Container Database (MariaDB 11)       │
│  - Volume persisten: db_data           │
│  - Data aman tersimpan di harddisk VPS │
└────────────────────────────────────────┘
```

---

## Langkah 1: Persiapan Awal di VPS Ubuntu

Masuk ke VPS via terminal SSH dari komputer Anda:
```bash
ssh username@IP_VPS_ANDA
```

### 1.1 Update Paket Sistem
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw ca-certificates gnupg lsb-release
```

### 1.2 Instalasi Docker Engine & Docker Compose (Official Repo)
```bash
# Tambahkan GPG key resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Tambahkan repository Docker ke APT sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instal Docker CE, CLI, containerd, dan Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 1.3 Berikan Akses Docker ke User Non-Root
```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verifikasi instalasi:
```bash
docker --version
docker compose version
```

### 1.4 Konfigurasi Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Langkah 2: Mengunggah / Clone Proyek ke VPS

### Opsi A: Menggunakan Git Clone (Direkomendasikan)
```bash
cd ~
git clone https://github.com/USERNAME/REPO_NAME.git tools-app
cd tools-app
```

### Opsi B: Upload dari Komputer Lokal via Rsync / SCP
Dari terminal komputer lokal (Git Bash / PowerShell):
```bash
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' ./ username@IP_VPS_ANDA:~/tools-app/
```
Lalu di terminal VPS:
```bash
cd ~/tools-app
```

---

## Langkah 3: Konfigurasi Environment Variable (`.env`)

Salin file contoh `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka dan sesuaikan password database:
```bash
nano .env
```

Isi konfigurasi `.env`:
```env
# Port aplikasi web di VPS
APP_PORT=80
NODE_ENV=production

# Database MySQL / MariaDB
DB_NAME=jdp_tools_db
DB_USER=jdp_user
DB_PASSWORD=GantiPasswordUser123!
DB_ROOT_PASSWORD=GantiPasswordRoot123!
```
*(Tekan `Ctrl + O` lalu `Enter` untuk menyimpan, kemudian `Ctrl + X` untuk keluar)*.

---

## Langkah 4: Menjalankan Deployment

### Cara 1: Menggunakan Skrip Otomatis `deploy.sh`
```bash
chmod +x deploy.sh
./deploy.sh
```

### Cara 2: Menjalankan Manual dengan Docker Compose
```bash
docker compose up -d --build --remove-orphans
```

Docker akan mengunduh image MariaDB, membangun image Backend & Frontend, lalu menjalankannya secara terorkestrasi.

---

## Langkah 5: Verifikasi Status Layanan

### 5.1 Periksa Status Container
```bash
docker compose ps
```
Pastikan ketiga container berikut berstatus **Up**:
- `tools-db` (berstatus **healthy**)
- `tools-backend` (berstatus **Up**)
- `tools-app` (berstatus **healthy**)

### 5.2 Tes Endpoint Backend & Database
Jalankan pengujian curl internal dari VPS:
```bash
# Tes health backend
curl http://localhost/api/health

# Tes respon data storage
curl http://localhost/api/storage
```
Respons yang diharapkan: `{"status":"healthy","service":"jdp-tools-backend"}`.

### 5.3 Periksa Log Container
Jika ingin memantau log aktivitas aplikasi:
```bash
# Log backend
docker compose logs -f backend

# Log database
docker compose logs -f db

# Log frontend Nginx
docker compose logs -f app
```
*(Tekan `Ctrl + C` untuk keluar dari tampilan log)*.

### 5.4 Buka di Browser
Buka browser di laptop atau HP Anda:
```text
http://<IP_VPS_ANDA>
```
Coba buat satu dokumen Berita Acara atau Surat Tugas di Laptop A. Kemudian buka link tersebut dari Laptop B atau smartphone, Anda akan langsung melihat dokumen tersebut muncul karena data tersimpan di database MariaDB VPS!

---

## Langkah 6: Update Fitur Baru dari Lokal ke VPS (Tanpa Mengganggu Server)

Ketika aplikasi sudah berjalan di VPS dan Anda ingin menambahkan fitur baru yang sudah diuji di komputer lokal, ikuti alur kerja aman berikut:

### 1. Di Komputer Lokal (Laptop Anda)
1. Kembangkan dan uji fitur Anda di lokal (jalankan `npm run dev`).
2. Uji compile untuk memastikan tidak ada error TypeScript:
   ```bash
   npm run build
   ```
3. Commit dan push perubahan ke repository Git:
   ```bash
   git add .
   git commit -m "feat: penambahan fitur X"
   git push origin main
   ```

### 2. Di Server VPS
Masuk ke VPS melalui SSH dan buka folder proyek:
```bash
cd ~/tools-app
```

Pilih salah satu cara pembaruan berikut:

#### Cara A: Menggunakan Skrip Otomatis (Direkomendasikan)
```bash
./deploy.sh
```
*Skrip akan otomatis melakukan `git pull`, me-rebuild container versi baru di latar belakang, mengganti container secara instan, dan menjaga database MariaDB tetap berjalan normal.*

#### Cara B: Update Spesifik Tanpa Menyentuh Database (`--no-deps`)
Jika Anda hanya memperbarui tampilan frontend React:
```bash
git pull origin main
docker compose up -d --build --no-deps app
```
Jika Anda juga memperbarui kode backend REST API:
```bash
git pull origin main
docker compose up -d --build --no-deps app backend
```
> **Keunggulan `--no-deps`:** Container database `tools-db` tidak akan di-restart atau terputus sama sekali. Transaksi staf yang sedang berjalan tidak akan terganggu.

---

## Langkah 7: Prosedur Backup & Restore Database

Data MariaDB tersimpan dengan aman di Docker Volume bernama `db_data`. Untuk keamanan tambahan, lakukan backup rutin file `.sql`:

### 7.1 Backup Database ke File `.sql`
```bash
docker compose exec -T db mariadb-dump -u root -p$(grep DB_ROOT_PASSWORD .env | cut -d'=' -f2) jdp_tools_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 7.2 Restore Database dari File `.sql`
Jika ingin mengembalikan data dari file backup:
```bash
docker compose exec -T db mariadb -u root -p$(grep DB_ROOT_PASSWORD .env | cut -d'=' -f2) jdp_tools_db < nama_file_backup.sql
```

---

## Langkah 8: Pasang Subdomain / Domain & SSL HTTPS Gratis (Let's Encrypt Certbot)

Panduan ini menggunakan arsitektur reverse proxy:
**Browser (HTTPS Port 443)** ➡️ **Nginx Host VPS (Let's Encrypt)** ➡️ **Container Docker Aplikasi (Port 3000)**.

Contoh subdomain di bawah menggunakan: `generator.jembatandata.com` (silakan sesuaikan dengan subdomain/domain Anda).

### 8.1 Atur A Record di DNS Provider (IDCloudHost / Niagahoster / dll)
1. Buka dashboard DNS provider tempat Anda mengelola domain.
2. Tambahkan **A Record**:
   - **Type:** `A`
   - **Name:** `generator` (nama subdomain)
   - **Target / IPv4:** `IP_VPS_ANDA`
   - **TTL:** `3600` (atau otomatis)
3. Tunggu hingga DNS resolve. Anda dapat memverifikasinya dari terminal:
   ```bash
   ping generator.jembatandata.com
   ```
   *(Pastikan IP yang merespons adalah IP VPS Anda)*.

---

### 8.2 Ubah Port Docker Aplikasi ke Port Internal (3000)
Agar port 80 dan 443 di VPS dapat dikelola oleh Nginx host dan Certbot:
1. Buka file `.env` di folder proyek VPS:
   ```bash
   cd ~/tools-app
   nano .env
   ```
2. Pastikan atau ubah baris `APP_PORT`:
   ```env
   APP_PORT=3000
   ```
3. Terapkan pembaruan port container:
   ```bash
   docker compose up -d
   ```

---

### 8.3 Install Nginx dan Certbot di Host VPS Ubuntu
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

### 8.4 Buat Konfigurasi Reverse Proxy Nginx
1. Buat file konfigurasi di `/etc/nginx/sites-available/tools`:
   ```bash
   sudo nano /etc/nginx/sites-available/tools
   ```
2. Isi konfigurasi berikut:
   ```nginx
   server {
       listen 80;
       server_name generator.jembatandata.com;
       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   *(Simpan dengan `Ctrl + O` ➡️ `Enter` ➡️ `Ctrl + X`)*.

3. Aktifkan konfigurasi (gunakan flag `-sf` untuk menimpa link lama jika sudah ada):
   ```bash
   sudo ln -sf /etc/nginx/sites-available/tools /etc/nginx/sites-enabled/
   ```
4. Uji sintaks konfigurasi Nginx:
   ```bash
   sudo nginx -t
   ```
   *(Harus menghasilkan: `syntax is ok` dan `test is successful`)*.

---

### 8.5 Buka Firewall & Jalankan Service Nginx
Pastikan port 80 dan 443 terbuka di firewall dan service Nginx berjalan:
```bash
# Izinkan trafik HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Aktifkan Nginx agar auto-start saat reboot
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

### 8.6 Terbitkan Sertifikat SSL Gratis dengan Certbot
Jalankan perintah berikut:
```bash
sudo certbot --nginx -d generator.jembatandata.com
```

Saat prompt muncul:
1. **Email:** Masukkan email Anda (untuk pemberitahuan masa berlaku sertifikat).
2. **Terms of Service:** Ketik `Y` lalu `Enter`.
3. **Share email:** Ketik `N`.
4. **Redirect HTTP to HTTPS:** Pilih opsi redirect (jika ditanyakan) agar semua trafik HTTP otomatis dialihkan ke HTTPS.

Setelah selesai, Anda akan menerima pesan:
```text
Successfully received certificate.
Successfully deployed certificate for generator.jembatandata.com to /etc/nginx/sites-enabled/tools
Congratulations! You have successfully enabled HTTPS on https://generator.jembatandata.com
```

---

### 8.7 Verifikasi Auto-Renewal (Perpanjangan Otomatis)
Certbot secara otomatis membuat timer di latar belakang untuk memperpanjang sertifikat setiap 60–90 hari. Uji mekanisme auto-renewal dengan:
```bash
sudo certbot renew --dry-run
```
Jika muncul pesan `Congratulations, all simulated renewals succeeded`, maka SSL Anda akan **aktif dan diperpanjang otomatis selamanya secara gratis**.

---

### (Opsional) Metode Alternatif: Cloudflare Free SSL
Jika Anda lebih memilih tanpa Nginx host dan ingin proteksi DDoS / CDN gratis:
1. Daftarkan domain utama di [Cloudflare](https://dash.cloudflare.com/) (paket Free).
2. Ganti Nameserver di penyedia domain (IDCloudHost) ke Nameserver Cloudflare.
3. Di tab DNS Cloudflare, buat `A Record` untuk subdomain (`generator`) mengarah ke IP VPS dengan status **Proxied (Awan Oranye 🟠)**.
4. Di menu **SSL/TLS**, pilih mode **Flexible** dan aktifkan **Always Use HTTPS**. Container Docker dapat tetap berjalan di port 80 tanpa instalasi Nginx di host VPS.

---

## Rangkuman Perintah Harian (Cheat Sheet)

| Kebutuhan | Perintah |
| :--- | :--- |
| **Deploy update kode terbaru** | `./deploy.sh` |
| **Cek status semua container** | `docker compose ps` |
| **Lihat log aktivitas backend** | `docker compose logs -f backend` |
| **Restart semua service** | `docker compose restart` |
| **Hentikan semua service** | `docker compose down` |
| **Backup database** | `docker compose exec -T db mariadb-dump -u root -p... jdp_tools_db > backup.sql` |
| **Bersihkan disk cache Docker** | `docker image prune -f` |
