/**
 * Mock data dùng để test UI (trang chi tiết phim, trang xem phim, home).
 * Streamtape embed: dùng URL /e/ cho iframe (không dùng /v/).
 */

export type MovieStatus = "ONGOING" | "COMPLETED";

export interface MockServer {
  id: number;
  episodeId: number;
  name: string;
  embedUrl: string;
  priority: number;
  isActive: boolean;
}

export interface MockEpisode {
  id: number;
  movieId: number;
  name: string;
  episodeNumber: number;
  slug: string | null;
  servers: MockServer[];
}

export interface MockMovie {
  id: number;
  slug: string;
  title: string;
  originalTitle: string | null;
  description: string | null;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  status: MovieStatus;
  views: number;
  episodes: MockEpisode[];
}

/** Một phim đủ dữ liệu để test trang chi tiết + trang xem (3 tập, Streamtape embed). */
export const mockMovieDetail: MockMovie = {
  id: 1,
  slug: "phim-test-3-tap",
  title: "Phim Test 3 Tập",
  originalTitle: "Test Movie 3 Episodes",
  description:
    "Phim dùng để test hệ thống stream. Ba tập với link Streamtape thật, đủ để test UI trang chi tiết phim và trang xem phim.",
  poster: "https://placehold.co/300x450/1a1a2e/eee?text=Phim+Test",
  backdrop: "https://placehold.co/1280x720/16213e/eee?text=Phim+Test+3+Tập",
  year: 2025,
  status: "ONGOING",
  views: 0,
  episodes: [
    {
      id: 1,
      movieId: 1,
      name: "Tập 1",
      episodeNumber: 1,
      slug: "tap-1",
      servers: [
        {
          id: 1,
          episodeId: 1,
          name: "StreamTape",
          embedUrl: "https://streamtape.com/e/OJrDM2Rj16T76z/",
          priority: 0,
          isActive: true,
        },
      ],
    },
    {
      id: 2,
      movieId: 1,
      name: "Tập 2",
      episodeNumber: 2,
      slug: "tap-2",
      servers: [
        {
          id: 2,
          episodeId: 2,
          name: "StreamTape",
          embedUrl: "https://streamtape.com/e/rky62Lp0d2Sbpgb/",
          priority: 0,
          isActive: true,
        },
      ],
    },
    {
      id: 3,
      movieId: 1,
      name: "Tập 3",
      episodeNumber: 3,
      slug: "tap-3",
      servers: [
        {
          id: 3,
          episodeId: 3,
          name: "StreamTape",
          embedUrl: "https://streamtape.com/e/6oMlG83qVdcokw/",
          priority: 0,
          isActive: true,
        },
      ],
    },
  ],
};

/** Slug phim mock (để redirect / kiểm tra). */
export const MOCK_MOVIE_SLUG = mockMovieDetail.slug;

/** Danh sách phim rút gọn cho trang chủ (card, hero). */
export interface MockMovieCard {
  slug: string;
  title: string;
  poster?: string | null;
  year?: number | null;
  episodes?: number;
  status?: MovieStatus;
}

export const mockFeaturedMovie: MockMovieCard & {
  description: string | null;
  backdrop: string | null;
} = {
  slug: mockMovieDetail.slug,
  title: mockMovieDetail.title,
  description: mockMovieDetail.description,
  backdrop: mockMovieDetail.backdrop,
  poster: mockMovieDetail.poster,
  year: mockMovieDetail.year,
  episodes: mockMovieDetail.episodes.length,
  status: mockMovieDetail.status,
};

export const mockTrendingMovies: MockMovieCard[] = [
  {
    slug: "phim-test-3-tap",
    title: "Phim Test 3 Tập",
    year: 2025,
    episodes: 3,
    status: "ONGOING",
  },
  {
    slug: "tu-than",
    title: "Tử Thần",
    year: 2024,
    episodes: 20,
    status: "ONGOING",
  },
  {
    slug: "hon-ma",
    title: "Hồn Ma",
    year: 2024,
    episodes: 16,
    status: "COMPLETED",
  },
  {
    slug: "chiec-bong",
    title: "Chiếc Bóng",
    year: 2023,
    episodes: 24,
    status: "COMPLETED",
  },
  {
    slug: "bong-toi",
    title: "Bóng Tối",
    year: 2024,
    episodes: 12,
    status: "ONGOING",
  },
];

export const mockNewUpdates: MockMovieCard[] = [
  {
    slug: "phim-test-3-tap",
    title: "Phim Test 3 Tập",
    year: 2025,
    episodes: 3,
    status: "ONGOING",
  },
  {
    slug: "nu-hon",
    title: "Nụ Hôn Định Mệnh",
    year: 2024,
    episodes: 8,
    status: "ONGOING",
  },
  {
    slug: "song-sinh",
    title: "Song Sinh",
    year: 2024,
    episodes: 6,
    status: "ONGOING",
  },
  {
    slug: "ao-anh",
    title: "Ảo Ảnh",
    year: 2024,
    episodes: 10,
    status: "ONGOING",
  },
  {
    slug: "gio-mua",
    title: "Gió Mùa",
    year: 2024,
    episodes: 4,
    status: "ONGOING",
  },
];

export const mockPopularCompleted: MockMovieCard[] = [
  {
    slug: "hai-phuong",
    title: "Hai Phương",
    year: 2023,
    episodes: 32,
    status: "COMPLETED",
  },
  {
    slug: "gioi-han",
    title: "Giới Hạn",
    year: 2023,
    episodes: 24,
    status: "COMPLETED",
  },
  {
    slug: "tinh-yeu",
    title: "Tình Yêu Và Thù Hận",
    year: 2022,
    episodes: 40,
    status: "COMPLETED",
  },
  {
    slug: "bach-duong",
    title: "Bạch Dương",
    year: 2023,
    episodes: 20,
    status: "COMPLETED",
  },
  {
    slug: "hoang-hon",
    title: "Hoàng Hôn",
    year: 2022,
    episodes: 28,
    status: "COMPLETED",
  },
];

/** Lấy phim mock theo slug (để test trang chi tiết / xem khi không dùng DB). */
export function getMockMovieBySlug(slug: string): MockMovie | null {
  if (slug === mockMovieDetail.slug) return mockMovieDetail;
  return null;
}

/** Lấy server chính (embed) của một tập. */
export function getMockPrimaryServer(
  movie: MockMovie,
  episodeNumber: number
): MockServer | null {
  const ep = movie.episodes.find(
    (e: MockEpisode) => e.episodeNumber === episodeNumber
  );
  if (!ep?.servers?.length) return null;
  const active = ep.servers.filter((s: MockServer) => s.isActive);
  active.sort((a: MockServer, b: MockServer) => a.priority - b.priority);
  return active[0] ?? null;
}
