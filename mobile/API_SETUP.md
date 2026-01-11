# Hướng dẫn kết nối Mobile App với Backend API

## 1. Cấu hình API Base URL

Mobile app cần kết nối với backend API. Bạn có thể cấu hình API base URL bằng 2 cách:

### Cách 1: Sử dụng biến môi trường (Khuyến nghị)

Tạo file `.env` trong thư mục `mobile/` với nội dung:

```
EXPO_PUBLIC_API_BASE=http://YOUR_IP_ADDRESS:3000/api
```

**Lưu ý:**
- Thay `YOUR_IP_ADDRESS` bằng địa chỉ IP của máy tính chạy backend
- Để tìm IP address:
  - **macOS/Linux**: Chạy `ifconfig` hoặc `ip addr`
  - **Windows**: Chạy `ipconfig`
  - Thường là dạng `192.168.x.x` hoặc `10.0.x.x`

**Ví dụ:**
```
EXPO_PUBLIC_API_BASE=http://192.168.1.100:3000/api
```

### Cách 2: Sửa trực tiếp trong code

Nếu không sử dụng biến môi trường, mặc định sẽ là `http://localhost:3000/api`.

Bạn có thể sửa trong file `mobile/src/utils/api.ts`:

```typescript
export const API_BASE =
  (process.env.EXPO_PUBLIC_API_BASE as string | undefined) || "http://YOUR_IP_ADDRESS:3000/api";
```

## 2. Đảm bảo Backend đang chạy

Backend phải đang chạy và có thể truy cập từ mobile device:

```bash
cd backend
npm run dev
# hoặc
pnpm dev
```

Backend sẽ chạy tại `http://localhost:3000` (hoặc port khác nếu đã cấu hình).

## 3. Kiểm tra CORS

Backend đã được cấu hình CORS để cho phép mobile app kết nối:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

## 4. Kết nối từ thiết bị thật

Khi chạy trên thiết bị thật (iOS/Android), **không thể** sử dụng `localhost`. Bạn **phải** sử dụng IP address của máy tính chạy backend.

### Kiểm tra kết nối:

1. Đảm bảo mobile device và máy tính chạy backend cùng một mạng WiFi
2. Kiểm tra có thể ping được máy tính từ mobile device
3. Thử mở `http://YOUR_IP_ADDRESS:3000/api/events` trong trình duyệt mobile để kiểm tra

## 5. Chạy Mobile App

```bash
cd mobile
npm start
# hoặc
pnpm start
```

Sau đó chọn:
- `a` để chạy trên Android
- `i` để chạy trên iOS
- Quét QR code với Expo Go app

## 6. Khắc phục sự cố

### Lỗi: "Network request failed"

**Nguyên nhân:** Mobile app không thể kết nối với backend API.

**Giải pháp:**
1. Kiểm tra backend đang chạy
2. Kiểm tra IP address đúng
3. Kiểm tra firewall không chặn port 3000
4. Đảm bảo mobile device và máy tính cùng mạng WiFi

### Lỗi: "CORS error"

**Nguyên nhân:** Backend chưa cho phép CORS.

**Giải pháp:** Backend đã được cấu hình CORS, nếu vẫn lỗi thì kiểm tra lại cấu hình.

### Lỗi: "Connection refused"

**Nguyên nhân:** Backend không lắng nghe trên IP address đó.

**Giải pháp:**
1. Kiểm tra backend đang chạy
2. Kiểm tra backend lắng nghe trên đúng port
3. Thử truy cập API từ trình duyệt trước

## 7. API Endpoints được sử dụng

Mobile app sử dụng các API endpoints sau:

- `GET /api/events` - Lấy danh sách events
- `GET /api/events?featured=true` - Lấy events featured
- `GET /api/events?trending=true` - Lấy events trending
- `GET /api/events?tags=tag1,tag2` - Lấy events theo tags
- `GET /api/banner` - Lấy banner
- `GET /api/posts` - Lấy danh sách posts
- `GET /api/posts/:id` - Lấy chi tiết post
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/verify-email` - Xác minh email
- `POST /api/auth/me` - Lấy thông tin user
- `POST /api/bookings` - Tạo booking
- Và các endpoints khác...

## 8. Test kết nối

Sau khi cấu hình, bạn có thể test bằng cách:

1. Mở app trên mobile
2. Kiểm tra HomeScreen có hiển thị events từ backend không
3. Kiểm tra banner có hiển thị không
4. Thử đăng nhập/đăng ký

Nếu có lỗi, kiểm tra console log của Expo để xem chi tiết lỗi.
