import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Cast để tương thích khi Prisma client chưa generate lại từ schema (có Genre, User.username)
type PrismaSeed = PrismaClient & {
  genre: { upsert: (args: { where: { slug: string }; update: { name: string; order: number }; create: { slug: string; name: string; order: number } }) => Promise<unknown> };
  user: {
    upsert: (args: {
      where: { username: string };
      create: { username: string; email: string; name: string; password: string; role: Role };
      update: Record<string, never>;
    }) => Promise<{ id: string; username: string; email: string | null; name: string | null }>;
  };
};
const db = prisma as unknown as PrismaSeed;

const GENRES = [
  { slug: "tinh-cam", name: "Tình cảm", order: 1 },
  { slug: "drama", name: "Drama", order: 2 },
  { slug: "gia-dinh", name: "Gia đình", order: 3 },
  { slug: "hoc-duong", name: "Học đường", order: 4 },
  { slug: "cong-so", name: "Công sở", order: 5 },
  { slug: "tong-tai", name: "Tổng tài", order: 6 },
  { slug: "trinh-tham", name: "Trinh thám", order: 7 },
  { slug: "trung-sinh", name: "Trùng Sinh", order: 8 },
  { slug: "xuyen-khong", name: "Xuyên Không", order: 9 },
  { slug: "hoat-hinh", name: "Hoạt Hình", order: 10 },
] as const;

async function main() {
  // --- Genre ---
  for (const g of GENRES) {
    await db.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name, order: g.order },
      create: { slug: g.slug, name: g.name, order: g.order },
    });
  }
  console.log("✅ Genres seeded");

  // --- User (username bắt buộc, email optional) ---
  const adminUsername = "admin";
  const adminEmail = "admin@drama.app";
  const adminPassword = "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await db.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      name: "Super Admin",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin user created:", admin.username, admin.email ?? "(no email)");

  // --- Movie ---
  const movie = await prisma.movie.upsert({
    where: { slug: "phim-test-3-tap" },
    update: {},
    create: {
      slug: "phim-test-3-tap",
      title: "Phim Test 3 Tập",
      originalTitle: null,
      description: "Phim dùng để test hệ thống stream",
      poster: "https://placehold.co/300x450",
      backdrop: "https://placehold.co/1280x720",
      year: 2025,
      status: "ONGOING",
      views: 0,
    },
  });

  // --- Episodes + Servers ---
  const episodesData = [
    { episodeNumber: 1, name: "Tập 1", embedUrl: "https://streamtape.com/v/OJrDM2Rj16T76z/1.mp4" },
    { episodeNumber: 2, name: "Tập 2", embedUrl: "https://streamtape.com/v/rky62Lp0d2Sbpgb/2.mp4" },
    { episodeNumber: 3, name: "Tập 3", embedUrl: "https://streamtape.com/v/6oMlG83qVdcokw/3.mp4" },
  ];

  for (const ep of episodesData) {
    await prisma.episode.upsert({
      where: {
        movieId_episodeNumber: { movieId: movie.id, episodeNumber: ep.episodeNumber },
      },
      update: { name: ep.name },
      create: {
        movieId: movie.id,
        episodeNumber: ep.episodeNumber,
        name: ep.name,
        slug: null,
        servers: {
          create: {
            name: "StreamTape",
            embedUrl: ep.embedUrl,
            priority: 0,
            isActive: true,
          },
        },
      },
    });
  }
  console.log("✅ Movie + Episodes + Servers seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
