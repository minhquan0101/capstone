import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/HeroBanner.css";

export type HeroBannerItem = {
  imageUrl: string;
  title?: string;
  href?: string;
  onClick?: () => void;
};

function chunkPairs(arr: HeroBannerItem[]) {
  const pairs: Array<{ left: HeroBannerItem; right: HeroBannerItem }> = [];
  for (let i = 0; i < arr.length; i += 2) {
    const left = arr[i];
    const right = arr[i + 1] || arr[0];
    if (left) pairs.push({ left, right });
  }
  return pairs;
}

export default function HeroBanner({ banners }: { banners: HeroBannerItem[] }) {
  if (!banners?.length) return null;

  const slides = chunkPairs(banners);

  const clickItem = (item: HeroBannerItem, e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
  };

  return (
    <section className="tb-hero-wrap">
      <div className="tb-hero-inner">
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
        >
          {slides.map((s, idx) => (
            <SwiperSlide key={idx}>
              <div className="tb-hero-grid">
                <a
                  className="tb-hero-tile tb-hero-left"
                  href={s.left.href || "#"}
                  onClick={(e) => clickItem(s.left, e)}
                >
                  <div
                    className="tb-hero-bg"
                    style={{ backgroundImage: `url(${s.left.imageUrl})` }}
                  />
                  <div className="tb-hero-gradient">
                    <button className="tb-hero-btn" type="button">
                      Xem chi tiết
                    </button>
                  </div>
                </a>

                <a
                  className="tb-hero-tile tb-hero-right"
                  href={s.right.href || "#"}
                  onClick={(e) => clickItem(s.right, e)}
                >
                  <div
                    className="tb-hero-bg"
                    style={{ backgroundImage: `url(${s.right.imageUrl})` }}
                  />
                  <div className="tb-hero-gradient">
                    <button className="tb-hero-btn" type="button">
                      Xem chi tiết
                    </button>
                  </div>
                </a>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
