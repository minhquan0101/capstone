import { connectDB } from "../src/utils/mongodb";
import { Post } from "../src/models/Post";

const blogPosts = [
  {
    title: "Tổ chức sự kiện tất niên công ty trọn gói tại Bình Dương | Star Event đồng hành cùng doanh nghiệp",
    content: `Tổ chức sự kiện tất niên công ty chuyên nghiệp - Star Event đồng hành cùng doanh nghiệp trong việc tạo nên những khoảnh khắc đáng nhớ.

Sự kiện tất niên là dịp để các doanh nghiệp tri ân nhân viên, đối tác và khách hàng sau một năm làm việc vất vả. Với kinh nghiệm nhiều năm trong lĩnh vực tổ chức sự kiện, Star Event tự hào mang đến những giải pháp trọn gói, chuyên nghiệp.

**Các dịch vụ chính:**
- Thiết kế và trang trí không gian sự kiện
- Âm thanh, ánh sáng chuyên nghiệp
- MC và chương trình giải trí
- Ẩm thực cao cấp
- Quà tặng và phần thưởng

Hãy liên hệ với chúng tôi để được tư vấn miễn phí!`,
    type: "blog" as const,
  },
  {
    title: "Tổ chức tất niên công ty chuyên nghiệp trọn gói tại Bình Dương 2025",
    content: `Tổ chức tất niên công ty chuyên nghiệp 2025 – Bí quyết thành công cho doanh nghiệp.

Năm 2025 đánh dấu một bước ngoặt mới trong việc tổ chức sự kiện doanh nghiệp. Với xu hướng kết hợp giữa truyền thống và hiện đại, các sự kiện tất niên ngày càng được đầu tư kỹ lưỡng hơn.

**Những điểm nổi bật:**
- Công nghệ hiện đại trong tổ chức sự kiện
- Trải nghiệm khách hàng được nâng cao
- Tiết kiệm chi phí với gói dịch vụ trọn gói
- Đội ngũ chuyên nghiệp, giàu kinh nghiệm

Star Event cam kết mang đến những sự kiện tất niên đáng nhớ nhất cho doanh nghiệp của bạn.`,
    type: "blog" as const,
  },
  {
    title: "Tổ chức lễ khởi công | Tổ chức lễ động thổ nhà máy tại Bình Dương mới nhất 2025",
    content: `1. Lễ khởi công – Lễ động thổ là gì? 

Lễ khởi công là buổi lễ quan trọng đánh dấu sự bắt đầu của một dự án xây dựng. Đây là nghi lễ truyền thống mang ý nghĩa tâm linh và văn hóa sâu sắc.

**Quy trình tổ chức lễ khởi công:**
- Chuẩn bị không gian và trang trí
- Nghi thức cúng bái (nếu có)
- Phát biểu của lãnh đạo
- Nghi thức động thổ
- Chụp ảnh lưu niệm

Star Event chuyên tổ chức các lễ khởi công, động thổ cho các dự án lớn tại Bình Dương và khu vực lân cận.`,
    type: "blog" as const,
  },
  {
    title: "Tổ chức sự kiện trọn gói | Tổ chức sự kiện chuyên nghiệp tại Bình Dương",
    content: `TỔ CHỨC SỰ KIỆN TRỌN GÓI TẠI BÌNH DƯƠNG - STAR EVENT CHUYÊN NGHIỆP, UY TÍN.

Với hơn 10 năm kinh nghiệm trong lĩnh vực tổ chức sự kiện, Star Event tự hào là đối tác tin cậy của hàng trăm doanh nghiệp tại Bình Dương.

**Dịch vụ tổ chức sự kiện trọn gói:**
- Sự kiện doanh nghiệp (hội nghị, hội thảo, tất niên)
- Sự kiện khai trương, ra mắt sản phẩm
- Lễ khởi công, động thổ
- Sự kiện giải trí, văn hóa
- Team building, gala dinner

Chúng tôi cam kết mang đến những sự kiện thành công, ấn tượng và đáng nhớ.`,
    type: "blog" as const,
  },
  {
    title: "Dịch vụ tổ chức tất niên – Tiệc công ty cuối năm trọn gói tại Bình Dương 2025",
    content: `Dịch vụ tổ chức tất niên không chỉ đơn giản là một buổi tiệc, mà là cơ hội để doanh nghiệp thể hiện sự tri ân và gắn kết với đội ngũ nhân viên.

**Gói dịch vụ tất niên trọn gói bao gồm:**
- Thiết kế concept và trang trí
- Âm thanh, ánh sáng, màn hình LED
- MC chuyên nghiệp và chương trình giải trí
- Ẩm thực buffet hoặc set menu
- Quà tặng và phần thưởng
- Chụp ảnh, quay phim

Hãy để Star Event biến sự kiện tất niên của bạn thành một kỷ niệm đáng nhớ!`,
    type: "blog" as const,
  },
  {
    title: "5 loại quà khai trương này sẽ giúp bạn tạo ấn tượng với khách mời",
    content: `Khai trương là một cột mốc trọng đại, đánh dấu sự khởi đầu cho một hành trình kinh doanh mới. Việc chọn quà tặng phù hợp sẽ giúp bạn tạo ấn tượng tốt với khách mời.

**5 loại quà khai trương phổ biến:**

1. **Quà tặng cao cấp có logo công ty**: Túi xách, bút ký, sổ tay
2. **Voucher giảm giá**: Tạo cơ hội để khách hàng quay lại
3. **Sản phẩm độc quyền**: Mang đậm dấu ấn thương hiệu
4. **Quà tặng thực phẩm**: Bánh kẹo, trà, cà phê cao cấp
5. **Quà tặng số may mắn**: Tạo không khí vui vẻ, hứng khởi

Star Event sẽ tư vấn và hỗ trợ bạn chọn quà tặng phù hợp nhất cho sự kiện khai trương.`,
    type: "blog" as const,
  },
  {
    title: "Những mẫu cổng bóng khai trương độc đáo, ấn tượng",
    content: `Trong ngày trọng đại ra mắt, giữa vô vàn các hạng mục trang trí, cổng bóng khai trương luôn là điểm nhấn thu hút sự chú ý đầu tiên.

**Các mẫu cổng bóng phổ biến:**
- Cổng bóng tròn truyền thống
- Cổng bóng hình vòm hiện đại
- Cổng bóng kết hợp hoa tươi
- Cổng bóng theo chủ đề thương hiệu
- Cổng bóng LED phát sáng

Mỗi mẫu cổng bóng đều mang đến một phong cách riêng, phù hợp với từng loại hình kinh doanh. Star Event chuyên thiết kế và thi công cổng bóng khai trương độc đáo, ấn tượng.`,
    type: "blog" as const,
  },
  {
    title: "Mẫu kịch bản khai trương cửa hàng, công ty chuyên nghiệp",
    content: `Khai trương không chỉ là một sự kiện ra mắt, mà còn là một bước quan trọng trong chiến lược marketing của doanh nghiệp.

**Kịch bản khai trương chuyên nghiệp bao gồm:**

**Phần 1: Khai mạc (15 phút)**
- Đón tiếp khách mời
- Chụp ảnh check-in
- Phát quà tặng

**Phần 2: Nghi thức (20 phút)**
- Phát biểu của lãnh đạo
- Cắt băng khai trương
- Nghi thức cúng bái (nếu có)

**Phần 3: Giải trí (30 phút)**
- Tiết mục văn nghệ
- Rút thăm trúng thưởng
- Tham quan và trải nghiệm

Star Event sẽ giúp bạn xây dựng kịch bản khai trương hoàn hảo, phù hợp với ngân sách và mục tiêu của doanh nghiệp.`,
    type: "blog" as const,
  },
  {
    title: "10 Ý tưởng trang trí khai trương hoành tráng, ít tốn chi phí",
    content: `Trong ngày trọng đại ra mắt, không gian cửa hàng chính là "bộ mặt" đầu tiên mà khách hàng nhìn thấy. Việc trang trí đẹp mắt sẽ tạo ấn tượng tốt và thu hút khách hàng.

**10 ý tưởng trang trí tiết kiệm:**

1. Sử dụng bóng bay với màu sắc thương hiệu
2. Banner và backdrop in ấn chất lượng
3. Cây xanh và hoa tươi điểm xuyết
4. Đèn LED tạo không gian ấm cúng
5. Thảm đỏ tạo cảm giác sang trọng
6. Bàn tiếp tân được trang trí đẹp mắt
7. Khu vực chụp ảnh selfie
8. Quầy phát quà tặng
9. Màn hình hiển thị thông tin
10. Âm thanh nền tạo không khí

Star Event sẽ giúp bạn trang trí sự kiện khai trương đẹp mắt mà vẫn tiết kiệm chi phí.`,
    type: "blog" as const,
  },
  {
    title: "50+ Mẫu cổng hơi khai trương độc đáo, ấn tượng",
    content: `Trong bất kỳ sự kiện khai trương nào, việc tạo ấn tượng đầu tiên với khách hàng là vô cùng quan trọng. Cổng hơi khai trương là một trong những yếu tố tạo nên sự khác biệt.

**Các mẫu cổng hơi phổ biến:**
- Cổng hơi hình vòm cổ điển
- Cổng hơi hình mái nhà
- Cổng hơi theo chủ đề (công ty, cửa hàng)
- Cổng hơi kết hợp banner
- Cổng hơi LED phát sáng ban đêm

**Ưu điểm của cổng hơi:**
- Dễ dàng lắp đặt và tháo gỡ
- Có thể tái sử dụng nhiều lần
- Tạo điểm nhấn ấn tượng
- Phù hợp với mọi không gian

Star Event cung cấp hơn 50 mẫu cổng hơi khai trương đa dạng, phù hợp với mọi nhu cầu và ngân sách của khách hàng.`,
    type: "blog" as const,
  },
];

async function seedBlogs() {
  try {
    await connectDB();
    console.log("Đang kết nối database...");

    // Xóa các bài blog cũ (tùy chọn)
    // await Post.deleteMany({ type: "blog" });
    // console.log("Đã xóa các bài blog cũ");

    // Tạo các bài blog mới
    const createdPosts = [];
    for (const post of blogPosts) {
      const existingPost = await Post.findOne({ title: post.title });
      if (!existingPost) {
        const newPost = await Post.create(post);
        createdPosts.push(newPost);
        console.log(`✓ Đã tạo bài: "${post.title}"`);
      } else {
        console.log(`- Đã tồn tại: "${post.title}"`);
      }
    }

    console.log(`\n✅ Hoàn thành! Đã tạo ${createdPosts.length} bài blog mới.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed blogs:", error);
    process.exit(1);
  }
}

seedBlogs();

