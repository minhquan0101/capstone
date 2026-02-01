# Windows Setup (Expo + Backend + Frontend)

Hướng dẫn này giúp bạn clone repo trên Windows và chạy được toàn bộ hệ thống.

## 1) Yêu cầu
- Node.js LTS (>= 16, khuyến nghị 18+)
- Git for Windows
- (Tuỳ chọn) VS Code

## 2) Clone repo
```bash
git clone <repo_url>
cd capstone
```

## 3) Cài dependencies
```bash
cd backend
npm install
cd ..\frontend
npm install
cd ..\mobile
npm install
```

## 4) Chạy backend (API + web Next.js)
```bash
cd backend
npm run dev
```
Mặc định chạy ở `http://localhost:3000`.

## 5) Chạy frontend (React web)
```bash
cd frontend
npm start
```
Mặc định chạy ở `http://localhost:3001`.

## 6) Chạy mobile (Expo)
```bash
cd mobile
npx expo start
```

### Kết nối mobile với backend
Tạo file `mobile/.env`:
```
EXPO_PUBLIC_API_BASE=http://<IP_MAY_TINH_WINDOWS>:3000/api
```
Lấy IP bằng:
```bash
ipconfig
```
Ví dụ:
```
EXPO_PUBLIC_API_BASE=http://192.168.1.10:3000/api
```

## 7) Mẹo khi chạy trên Windows
- Nếu Expo không thấy QR: thử `npx expo start --tunnel`.
- Nếu lỗi quyền PowerShell: mở PowerShell as Admin và chạy:
  ```bash
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- Nếu port bị chiếm: đổi port trong `.env` hoặc tắt process đang chạy.

## 8) Chạy nhanh (tóm tắt)
```bash
cd backend   && npm install && npm run dev
cd frontend  && npm install && npm start
cd mobile    && npm install && npx expo start
```
