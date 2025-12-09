# Hướng dẫn Test API Tạo Sự Kiện trong Postman

## Thông tin Endpoint

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/events`
- **Authentication**: Không cần (chưa có auth)

## Các bước test trong Postman

### Bước 1: Tạo Request mới
1. Mở Postman
2. Click **New** → **HTTP Request**
3. Chọn method **POST**
4. Nhập URL: `http://localhost:3000/api/events`

### Bước 2: Cấu hình Headers
1. Vào tab **Headers**
2. Thêm header:
   - **Key**: `Content-Type`
   - **Value**: `application/json`

### Bước 3: Cấu hình Body
1. Vào tab **Body**
2. Chọn **raw**
3. Chọn format **JSON** (dropdown bên phải)
4. Nhập JSON body:

#### Ví dụ 1: Tạo sự kiện đầy đủ thông tin
```json
{
  "title": "Hội thảo công nghệ 2024",
  "description": "Hội thảo về các xu hướng công nghệ mới nhất",
  "location": "Hà Nội, Việt Nam",
  "date": "2024-12-25T10:00:00.000Z"
}
```

#### Ví dụ 2: Tạo sự kiện chỉ với title (tối thiểu)
```json
{
  "title": "Sự kiện test"
}
```

#### Ví dụ 3: Tạo sự kiện với một số thông tin
```json
{
  "title": "Workshop React",
  "description": "Học React từ cơ bản đến nâng cao",
  "location": "TP.HCM"
}
```

### Bước 4: Gửi Request
1. Click nút **Send**
2. Kiểm tra response:
   - **Status**: `201 Created` (thành công)
   - **Body**: JSON chứa thông tin sự kiện vừa tạo

## Cấu trúc Request Body

| Trường | Loại | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `title` | string | ✅ Có | Tiêu đề sự kiện |
| `description` | string | ❌ Không | Mô tả sự kiện |
| `location` | string | ❌ Không | Địa điểm tổ chức |
| `date` | string (ISO 8601) | ❌ Không | Ngày giờ sự kiện (format: `YYYY-MM-DDTHH:mm:ss.sssZ`) |

## Các Response có thể nhận được

### ✅ Thành công (201 Created)
```json
{
  "event": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Hội thảo công nghệ 2024",
    "description": "Hội thảo về các xu hướng công nghệ mới nhất",
    "location": "Hà Nội, Việt Nam",
    "date": "2024-12-25T10:00:00.000Z",
    "createdAt": "2024-01-15T08:30:00.000Z",
    "updatedAt": "2024-01-15T08:30:00.000Z"
  }
}
```

### ❌ Lỗi thiếu title (400 Bad Request)
```json
{
  "message": "Thiếu tiêu đề sự kiện"
}
```

### ❌ Lỗi server (500 Internal Server Error)
```json
{
  "message": "Lỗi server"
}
```

## Lưu ý

1. **Đảm bảo backend đang chạy**: 
   - Mở terminal trong thư mục `backend`
   - Chạy lệnh: `npm run dev`
   - Backend sẽ chạy tại `http://localhost:3000`

2. **Đảm bảo MongoDB đang kết nối**: 
   - Kiểm tra file `.env` trong thư mục `backend` có cấu hình `MONGODB_URI`

3. **Format Date**: 
   - Sử dụng format ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`
   - Ví dụ: `"2024-12-25T10:00:00.000Z"`

4. **CORS**: 
   - API đã được cấu hình CORS để cho phép request từ mọi origin

## Test các trường hợp lỗi

### Test 1: Thiếu title
```json
{
  "description": "Mô tả không có title"
}
```
**Kỳ vọng**: Status 400, message "Thiếu tiêu đề sự kiện"

### Test 2: Title rỗng
```json
{
  "title": ""
}
```
**Kỳ vọng**: Status 400 hoặc 500 (tùy validation của MongoDB)

### Test 3: Date không hợp lệ
```json
{
  "title": "Test",
  "date": "invalid-date"
}
```
**Kỳ vọng**: Có thể tạo thành công nhưng date sẽ là `undefined` hoặc lỗi


