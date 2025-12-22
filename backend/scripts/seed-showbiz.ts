import { connectDB } from "../src/utils/mongodb";
import { Post } from "../src/models/Post";

const showbizPosts = [
  {
    title: "Hoài Linh mừng tuổi 56 bên đại gia đình",
    content: `Nghệ sĩ Hoài Linh vừa tổ chức sinh nhật tuổi 56 trong không khí ấm cúng bên cạnh mẹ, em trai Dương Triệu Vũ và các thành viên trong gia đình.

Buổi tiệc sinh nhật diễn ra tại nhà riêng với sự tham gia của đông đảo người thân. Hoài Linh xuất hiện trong bộ trang phục giản dị, nụ cười rạng rỡ khi được mọi người chúc mừng.

**Những khoảnh khắc đáng nhớ:**
- Nghệ sĩ Hoài Linh cắt bánh sinh nhật cùng gia đình
- Mẹ và em trai Dương Triệu Vũ có mặt trong buổi tiệc
- Không khí ấm cúng, đầy tình cảm gia đình

Nghệ sĩ Hoài Linh chia sẻ: "Tôi rất hạnh phúc khi được đón tuổi mới bên cạnh những người thân yêu nhất. Gia đình luôn là điều quý giá nhất trong cuộc đời tôi."`,
    type: "showbiz" as const,
  },
  {
    title: "Ảnh sao 19/12: Đỗ Mỹ Linh dạo phố Trung Quốc mùa thu",
    content: `Hoa hậu Đỗ Mỹ Linh vừa chia sẻ loạt ảnh đẹp mắt khi dạo phố tại Trung Quốc trong mùa thu vàng.

Trong những bức ảnh mới nhất, Đỗ Mỹ Linh xuất hiện với phong cách thời trang thanh lịch, kết hợp với khung cảnh mùa thu đầy thơ mộng. Cô diện chiếc áo khoác đen, tay xách túi nâu, tạo nên một hình ảnh vô cùng sang trọng.

**Những điểm nổi bật:**
- Đỗ Mỹ Linh khoe vẻ đẹp tự nhiên giữa khung cảnh mùa thu
- Phong cách thời trang thanh lịch, hiện đại
- Những bức ảnh được cộng đồng mạng yêu thích

Bên cạnh đó, Hoa hậu Đỗ Thị Hà cũng chia sẻ hình ảnh trang trí nhà cửa với hoa tươi, tạo không gian ấm cúng cho mùa đông sắp tới.`,
    type: "showbiz" as const,
  },
  {
    title: "Sao hạng A phủ sóng các lễ trao giải cuối năm",
    content: `Hàng loạt nghệ sĩ nổi tiếng xác nhận tham gia chuỗi sự kiện giải trí lớn nhất năm, tạo nên một mùa giải thưởng sôi động và đầy màu sắc.

Các lễ trao giải như Giải thưởng Điện ảnh, Giải thưởng Âm nhạc, và Giải thưởng Truyền hình đều quy tụ dàn sao hạng A của làng giải trí Việt Nam.

**Những gương mặt nổi bật:**
- Các diễn viên điện ảnh hàng đầu
- Ca sĩ đình đám với những bản hit triệu view
- Người mẫu, người đẹp nổi tiếng
- MC và nghệ sĩ hài được yêu thích

Các sự kiện này không chỉ là dịp để vinh danh những đóng góp của nghệ sĩ, mà còn là cơ hội để họ gặp gỡ, giao lưu và tạo nên những khoảnh khắc đáng nhớ.`,
    type: "showbiz" as const,
  },
  {
    title: "Liveshow kỷ niệm 20 năm sự nghiệp của ca sĩ X",
    content: `Đêm nhạc hứa hẹn mang đến những bản hit gắn liền với tuổi thơ của khán giả, tạo nên một không gian đầy cảm xúc và kỷ niệm.

Ca sĩ X đã chuẩn bị một chương trình đặc biệt để tri ân khán giả đã đồng hành cùng mình trong suốt 20 năm qua. Liveshow sẽ quy tụ nhiều khách mời đặc biệt và những tiết mục đầy bất ngờ.

**Những điểm đáng chờ đợi:**
- Những bản hit đình đám qua các thời kỳ
- Khách mời đặc biệt từ làng nhạc Việt
- Phần trình diễn đầy cảm xúc
- Khoảnh khắc tri ân khán giả

Vé của liveshow đã được bán hết chỉ sau vài giờ mở bán, cho thấy sức hút và tình cảm của khán giả dành cho ca sĩ X.`,
    type: "showbiz" as const,
  },
  {
    title: "Thảm đỏ rực lửa với những bộ cánh ấn tượng",
    content: `Dàn sao khoe phong cách thời trang độc đáo, tạo nên bữa tiệc thị giác mãn nhãn tại sự kiện giải trí lớn nhất năm.

Thảm đỏ luôn là nơi các ngôi sao thể hiện phong cách thời trang của mình. Năm nay, các nghệ sĩ đã mang đến những bộ trang phục vô cùng ấn tượng, từ cổ điển đến hiện đại.

**Những bộ cánh nổi bật:**
- Váy dạ hội lộng lẫy với đá quý
- Bộ suit thanh lịch, sang trọng
- Trang phục độc đáo, phá cách
- Phụ kiện tinh tế, đắt giá

Các nhà thiết kế thời trang hàng đầu đã tạo nên những bộ cánh độc quyền cho các ngôi sao, tạo nên một thảm đỏ đầy màu sắc và ấn tượng.`,
    type: "showbiz" as const,
  },
  {
    title: "Nghệ sĩ trẻ gây sốt với MV mới đạt triệu view trong 24h",
    content: `MV mới của nghệ sĩ trẻ đã tạo nên cơn sốt trên mạng xã hội khi đạt triệu lượt xem chỉ trong vòng 24 giờ đầu tiên.

Với concept độc đáo, hình ảnh đẹp mắt và giai điệu bắt tai, MV đã nhanh chóng chiếm lĩnh các bảng xếp hạng âm nhạc và nhận được sự yêu thích từ đông đảo khán giả.

**Những điểm nổi bật:**
- Concept sáng tạo, độc đáo
- Hình ảnh quay phim chuyên nghiệp
- Giai điệu bắt tai, dễ nhớ
- Sự xuất hiện của các gương mặt nổi tiếng

Nghệ sĩ trẻ chia sẻ: "Tôi rất bất ngờ và hạnh phúc khi MV nhận được sự yêu thích từ khán giả. Đây là động lực để tôi tiếp tục sáng tạo và mang đến những sản phẩm âm nhạc chất lượng hơn."`,
    type: "showbiz" as const,
  },
  {
    title: "Hội ngộ dàn sao tại sự kiện từ thiện lớn nhất năm",
    content: `Hàng trăm nghệ sĩ đã quy tụ tại sự kiện từ thiện lớn nhất năm để chung tay giúp đỡ những hoàn cảnh khó khăn.

Sự kiện không chỉ là dịp để các nghệ sĩ thể hiện tài năng, mà còn là cơ hội để họ đóng góp cho cộng đồng, mang đến niềm vui và hy vọng cho những người kém may mắn.

**Những hoạt động nổi bật:**
- Đấu giá các vật phẩm từ các nghệ sĩ
- Biểu diễn nghệ thuật đặc sắc
- Quyên góp từ thiện
- Trao quà cho các hoàn cảnh khó khăn

Sự kiện đã quyên góp được số tiền lớn, tất cả sẽ được sử dụng để hỗ trợ các hoàn cảnh khó khăn và các dự án từ thiện ý nghĩa.`,
    type: "showbiz" as const,
  },
  {
    title: "Phim mới của đạo diễn nổi tiếng ra mắt với doanh thu kỷ lục",
    content: `Bộ phim mới của đạo diễn nổi tiếng đã ra mắt và nhanh chóng đạt doanh thu kỷ lục trong tuần đầu tiên công chiếu.

Với dàn diễn viên hùng hậu, kịch bản hấp dẫn và kỹ xảo đỉnh cao, bộ phim đã thu hút đông đảo khán giả đến rạp và nhận được những đánh giá tích cực từ giới chuyên môn.

**Những điểm nổi bật:**
- Dàn diễn viên tài năng, nổi tiếng
- Kịch bản hấp dẫn, kịch tính
- Kỹ xảo điện ảnh đỉnh cao
- Doanh thu kỷ lục trong tuần đầu

Đạo diễn chia sẻ: "Tôi rất vui khi bộ phim nhận được sự yêu thích từ khán giả. Đây là thành quả của cả một quá trình làm việc nghiêm túc và đầy tâm huyết của cả đoàn làm phim."`,
    type: "showbiz" as const,
  },
  {
    title: "Người đẹp khoe vẻ đẹp tự nhiên trong bộ ảnh mới",
    content: `Người đẹp vừa chia sẻ bộ ảnh mới với phong cách tự nhiên, khoe vẻ đẹp không cần son phấn, nhận được sự yêu thích từ cộng đồng mạng.

Trong bộ ảnh, người đẹp xuất hiện với gương mặt tươi tắn, tự nhiên, tạo nên một hình ảnh vô cùng gần gũi và đáng yêu. Bộ ảnh nhanh chóng nhận được hàng nghìn lượt like và bình luận tích cực.

**Những điểm nổi bật:**
- Vẻ đẹp tự nhiên, không cần son phấn
- Phong cách thời trang giản dị, thanh lịch
- Khung cảnh đẹp mắt, thơ mộng
- Nhận được sự yêu thích từ cộng đồng mạng

Người đẹp chia sẻ: "Tôi muốn chia sẻ những khoảnh khắc tự nhiên nhất của mình với mọi người. Vẻ đẹp thật sự đến từ sự tự tin và hạnh phúc từ bên trong."`,
    type: "showbiz" as const,
  },
  {
    title: "Ca sĩ nổi tiếng công bố dự án âm nhạc mới đầy tham vọng",
    content: `Ca sĩ nổi tiếng vừa công bố dự án âm nhạc mới đầy tham vọng, hứa hẹn mang đến những sản phẩm âm nhạc chất lượng cao và đầy sáng tạo.

Dự án sẽ bao gồm album mới với nhiều thể loại âm nhạc khác nhau, từ pop, ballad đến R&B và hip-hop. Ca sĩ sẽ hợp tác với nhiều nhạc sĩ và nhà sản xuất hàng đầu trong và ngoài nước.

**Những điểm đáng chờ đợi:**
- Album mới với nhiều thể loại đa dạng
- Hợp tác với các nghệ sĩ quốc tế
- MV được đầu tư kỹ lưỡng
- Liveshow tour toàn quốc

Ca sĩ chia sẻ: "Đây là dự án tâm huyết nhất của tôi trong năm nay. Tôi hy vọng sẽ mang đến cho khán giả những trải nghiệm âm nhạc mới mẻ và đáng nhớ."`,
    type: "showbiz" as const,
  },
];

async function seedShowbiz() {
  try {
    await connectDB();
    console.log("Đang kết nối database...");

    // Tạo các bài showbiz mới
    const createdPosts = [];
    for (const post of showbizPosts) {
      const existingPost = await Post.findOne({ title: post.title });
      if (!existingPost) {
        const newPost = await Post.create(post);
        createdPosts.push(newPost);
        console.log(`✓ Đã tạo bài: "${post.title}"`);
      } else {
        console.log(`- Đã tồn tại: "${post.title}"`);
      }
    }

    console.log(`\n✅ Hoàn thành! Đã tạo ${createdPosts.length} bài showbiz mới.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed showbiz:", error);
    process.exit(1);
  }
}

seedShowbiz();

