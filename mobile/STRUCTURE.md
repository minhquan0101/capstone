# Cấu trúc dự án Mobile App

## Tổng quan

Dự án đã được tái cấu trúc để dễ bảo trì, mỗi file dưới 300 dòng và chia nhỏ thành các components có thể tái sử dụng.

## Cấu trúc thư mục

```
src/
├── components/          # Các components có thể tái sử dụng
│   ├── common/         # Components dùng chung
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── auth/           # Components liên quan đến authentication
│   │   ├── AuthCard.tsx
│   │   └── AuthLink.tsx
│   ├── events/         # Components hiển thị sự kiện
│   │   ├── HeroBanner.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventList.tsx
│   │   ├── TrendingEventCard.tsx
│   │   └── TrendingEventList.tsx
│   ├── posts/          # Components hiển thị bài viết
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   └── PostDetail.tsx
│   └── profile/        # Components profile
│       ├── ProfileInfo.tsx
│       └── PasswordForm.tsx
├── screens/            # Các màn hình chính (tất cả < 300 dòng)
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── VerifyEmailScreen.tsx
│   ├── ShowbizScreen.tsx
│   ├── ShowbizDetailScreen.tsx
│   ├── BlogsScreen.tsx
│   ├── BlogDetailScreen.tsx
│   ├── BookingScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   └── ChangePasswordScreen.tsx
├── hooks/              # Custom hooks
│   ├── useAuth.ts      # Logic authentication
│   ├── useUser.ts      # Quản lý user state
│   ├── usePosts.ts     # Fetch và quản lý posts
│   └── usePost.ts      # Fetch một post cụ thể
├── constants/          # Constants và data tĩnh
│   ├── colors.ts       # Màu sắc
│   └── events.ts       # Dữ liệu sự kiện mẫu
├── utils/              # Utilities
│   ├── api.ts          # API calls
│   ├── types.ts        # TypeScript types
│   └── formatters.ts   # Format functions (date, image, text)
└── App.tsx             # Entry point và navigation
```

## Nguyên tắc thiết kế

### 1. Components
- **Common Components**: Các components cơ bản có thể tái sử dụng (Button, Input, Card, etc.)
- **Feature Components**: Components cho từng tính năng cụ thể (EventCard, PostCard, etc.)
- Mỗi component chỉ làm một việc cụ thể
- Props rõ ràng, dễ hiểu

### 2. Screens
- Tất cả screens < 300 dòng
- Chỉ chứa logic điều hướng và kết hợp components
- Logic nghiệp vụ được tách vào hooks

### 3. Hooks
- `useAuth`: Xử lý login, register, verify email
- `useUser`: Quản lý state và thông tin user
- `usePosts`: Fetch danh sách posts
- `usePost`: Fetch một post cụ thể

### 4. Constants
- `colors.ts`: Tất cả màu sắc tập trung một chỗ
- `events.ts`: Dữ liệu sự kiện mẫu

### 5. Utils
- `formatters.ts`: Các hàm format (date, image URL, text excerpt)
- `api.ts`: Tất cả API calls
- `types.ts`: TypeScript type definitions

## Lợi ích

1. **Dễ bảo trì**: Mỗi file nhỏ, dễ tìm và sửa
2. **Tái sử dụng**: Components có thể dùng ở nhiều nơi
3. **Tách biệt concerns**: Logic, UI, và data được tách riêng
4. **Dễ test**: Components và hooks có thể test độc lập
5. **Dễ mở rộng**: Thêm tính năng mới dễ dàng

## Ví dụ sử dụng

### Sử dụng Button component
```tsx
import { Button } from '../components/common/Button';

<Button 
  title="Đăng nhập" 
  onPress={handleLogin}
  loading={isLoading}
  variant="primary"
/>
```

### Sử dụng useAuth hook
```tsx
import { useAuth } from '../hooks/useAuth';

const { loading, handleLogin } = useAuth();

handleLogin(email, password, onSuccess, onEmailVerification);
```

### Sử dụng formatters
```tsx
import { formatDate, getImageUrl } from '../utils/formatters';

const date = formatDate(post.createdAt);
const imageUrl = getImageUrl(post.imageUrl);
```

## Quy tắc đặt tên

- **Components**: PascalCase (Button, EventCard)
- **Hooks**: camelCase với prefix "use" (useAuth, useUser)
- **Utils**: camelCase (formatDate, getImageUrl)
- **Constants**: UPPER_SNAKE_CASE (SPECIAL_EVENTS, Colors)
- **Files**: PascalCase cho components, camelCase cho utils

## Checklist khi thêm tính năng mới

1. ✅ Tạo component riêng nếu logic phức tạp
2. ✅ Tạo hook nếu có logic nghiệp vụ
3. ✅ Thêm constants nếu có data tĩnh
4. ✅ Sử dụng formatters cho format data
5. ✅ Đảm bảo file < 300 dòng
6. ✅ Tái sử dụng components có sẵn

