# Hướng dẫn cài đặt và chạy dự án

## 1. Cài đặt Node.js

- Truy cập trang chính thức: [https://nodejs.org](https://nodejs.org)
- Tải phiên bản **LTS** (Recommended for most users).
- Cài đặt Node.js theo hướng dẫn trên trang.

## 2. Kiểm tra cài đặt

Mở terminal hoặc Command Prompt, chạy lệnh:
node -v
npm -v

## 3. Cài đặt phụ thuộc (Dependencies)
Nếu dự án có file package.json, chạy lệnh sau trong thư mục dự án:
npm install

## 4. Thay đổi đường dẫn đến SQL Server trong app.js
Thay đổi để dẫn đến nơi lưu các bảng Dim,Fact
const config = {
    user: 'sa',
    password: '12345678',
    server: 'DESKTOP-FMEL8VA',
    database: 'dbdw',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
## 5. Chạy dự án
node server.js
