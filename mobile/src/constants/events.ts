export interface EventData {
  id: number;
  title: string;
  location: string;
  date: string;
  thumbnail: string;
  tag: string;
}

export const SPECIAL_EVENTS: EventData[] = [
  {
    id: 1,
    title: "Concert Live 2025 - Hà Nội",
    location: "Trung tâm Hội nghị Quốc gia",
    date: "12/01/2025",
    thumbnail:
      "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tag: "Music",
  },
  {
    id: 2,
    title: "Tech Summit Vietnam",
    location: "SECC - TP. Hồ Chí Minh",
    date: "25/02/2025",
    thumbnail:
      "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tag: "Conference",
  },
  {
    id: 3,
    title: "Stand-up Comedy Night",
    location: "Nhà hát Thành phố",
    date: "08/03/2025",
    thumbnail:
      "https://images.pexels.com/photos/799091/pexels-photo-799091.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tag: "Comedy",
  },
  {
    id: 4,
    title: "Jazz Festival 2025",
    location: "Công viên Lê Văn Tám",
    date: "15/03/2025",
    thumbnail:
      "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tag: "Music",
  },
];

export const TRENDING_EVENTS: EventData[] = [
  {
    id: 5,
    title: "Rock Concert",
    location: "Sân vận động Mỹ Đình",
    date: "20/01/2025",
    thumbnail:
      "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tag: "Music",
  },
  {
    id: 6,
    title: "Bóng đá V-League",
    location: "Sân vận động Hàng Đẫy",
    date: "28/01/2025",
    thumbnail:
      "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tag: "Sports",
  },
];

