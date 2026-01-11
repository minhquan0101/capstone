# TicketFast Mobile App

Ứng dụng mobile cho nền tảng đặt vé sự kiện TicketFast, được xây dựng bằng React Native và Expo.

## Tính năng

- ✅ Đăng nhập / Đăng ký
- ✅ Xác minh email
- ✅ Quên mật khẩu / Đặt lại mật khẩu
- ✅ Trang chủ với danh sách sự kiện
- ✅ Tin tức ShowBiz
- ✅ Blogs / News
- ✅ Đặt vé sự kiện
- ✅ Quản lý hồ sơ
- ✅ Đổi mật khẩu

**Lưu ý:** Ứng dụng mobile chỉ dành cho người dùng thông thường, không có tính năng quản trị.

## Yêu cầu

- Node.js >= 16
- npm hoặc yarn
- Expo CLI (sẽ được cài đặt tự động)

## Cài đặt

1. Cài đặt dependencies:
```bash
cd mobile
npm install
```

2. Cấu hình API Base URL:
Tạo file `.env` trong thư mục `mobile`:
```
EXPO_PUBLIC_API_BASE=http://localhost:3000/api
```

Hoặc thay đổi trực tiếp trong file `src/utils/api.ts`:
```typescript
export const API_BASE = "http://YOUR_BACKEND_URL/api";
```

**Lưu ý:** Khi chạy trên thiết bị thật, thay `localhost` bằng địa chỉ IP của máy tính (ví dụ: `http://192.168.1.100:3000/api`)

## Chạy ứng dụng

### Development mode
```bash
npm start
```

Sau đó:
- Quét QR code bằng Expo Go app (iOS/Android)
- Nhấn `i` để mở iOS Simulator
- Nhấn `a` để mở Android Emulator
- Nhấn `w` để mở trên web browser

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Cấu trúc dự án

```
mobile/
├── App.tsx                 # Entry point và navigation setup
├── app.json                # Expo configuration
├── package.json
├── src/
│   ├── screens/            # Các màn hình
│   │   ├── HomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ShowbizScreen.tsx
│   │   ├── BlogsScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ...
│   └── utils/
│       ├── api.ts          # API functions
│       └── types.ts        # TypeScript types
└── assets/                 # Images, fonts, etc.
```

## Navigation

Ứng dụng sử dụng React Navigation với cấu trúc:
- **Bottom Tabs**: Trang chủ, ShowBiz, Blogs, Đặt vé, Tài khoản
- **Stack Navigation**: Chi tiết bài viết, đăng nhập, đăng ký, v.v.

## Lưu trữ dữ liệu

- Sử dụng `@react-native-async-storage/async-storage` để lưu token và thông tin người dùng
- Token được tự động kiểm tra khi khởi động app

## API Integration

Tất cả API calls được định nghĩa trong `src/utils/api.ts` và tương thích với backend hiện tại.

## Assets

Bạn cần tạo các file assets sau trong thư mục `assets/`:
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)

Hoặc sử dụng Expo Asset Generator để tạo tự động.

## Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend đang chạy
- Kiểm tra API_BASE URL
- Khi test trên thiết bị thật, đảm bảo thiết bị và máy tính cùng mạng

### Lỗi build
```bash
# Xóa cache và node_modules
rm -rf node_modules
npm install
expo start -c
```

## License

MIT

