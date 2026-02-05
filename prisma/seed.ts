import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
  for (const g of GENRES) {
    await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name, order: g.order },
      create: g,
    });
  }
  console.log("✅ Genres seeded");

  const email = "admin@drama.app";
  const password = "admin123";

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Super Admin",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // 1️⃣ Tạo Movie
  const movie = await prisma.movie.create({
    data: {
      slug: "phim-test-3-tap",
      title: "Phim Test 3 Tập",
      description: "Phim dùng để test hệ thống stream",
      year: 2025,
      status: "ONGOING",
      poster: "https://placehold.co/300x450",
      backdrop: "https://placehold.co/1280x720",
    },
  });

  // 2️⃣ Tạo Episode + Server
  const episodesData = [
    {
      episodeNumber: 1,
      name: "Tập 1",
      url: "https://streamtape.com/v/OJrDM2Rj16T76z/1.mp4",
    },
    {
      episodeNumber: 2,
      name: "Tập 2",
      url: "https://streamtape.com/v/rky62Lp0d2Sbpgb/2.mp4",
    },
    {
      episodeNumber: 3,
      name: "Tập 3",
      url: "https://streamtape.com/v/6oMlG83qVdcokw/3.mp4",
    },
  ];

  for (const ep of episodesData) {
    await prisma.episode.create({
      data: {
        movieId: movie.id,
        episodeNumber: ep.episodeNumber,
        name: ep.name,
        servers: {
          create: {
            name: "StreamTape",
            embedUrl: ep.url,
            priority: 0,
            isActive: true,
          },
        },
      },
    });
  }
  console.log("✅ Seed data created successfully");

  console.log("✅ Admin user created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
