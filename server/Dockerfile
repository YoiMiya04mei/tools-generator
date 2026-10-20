FROM node:22-alpine

WORKDIR /app

# Salin file dependensi
COPY package.json ./

# Install dependensi produksi
RUN npm install --omit=dev

# Salin kode backend
COPY src ./src

# Port backend internal
EXPOSE 5000

# Jalankan server
CMD ["node", "src/index.js"]
