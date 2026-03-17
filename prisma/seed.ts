import { PrismaClient, Role } from "../lib/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

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
  channel: {
    upsert: (args: {
      where: { slug: string };
      update: Record<string, never>;
      create: { slug: string; name: string };
    }) => Promise<unknown>;
  };
  tag: {
    createMany: (args: {
      data: Array<{ slug: string; name: string; order: number }>;
      skipDuplicates?: boolean;
    }) => Promise<unknown>;
  };
  label: {
    createMany: (args: {
      data: Array<{
        slug: string;
        name: string;
        order: number;
        textColor: string | null;
        backgroundColor: string | null;
      }>;
      skipDuplicates?: boolean;
    }) => Promise<unknown>;
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

  // --- Channel mặc định ---
  await db.channel.upsert({
    where: { slug: "dramahd" },
    update: {},
    create: {
      slug: "dramahd",
      name: "DramaHD",
    },
  });
  console.log("✅ Default channel seeded: dramahd");

  // --- Tags mẫu ---
  await db.tag.createMany({
    data: [
      { slug: "phim-hot", name: "Phim hot", order: 1 },
      { slug: "moi-cap-nhat", name: "Mới cập nhật", order: 2 },
      { slug: "de-cu", name: "Đề cử", order: 3 },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Tags seeded");

  // --- Labels mẫu ---
  await db.label.createMany({
    data: [
      {
        slug: "full-hd",
        name: "Full HD",
        order: 1,
        textColor: null,
        backgroundColor: null,
      },
      {
        slug: "sub-viet",
        name: "Sub Việt",
        order: 2,
        textColor: null,
        backgroundColor: null,
      },
      {
        slug: "ban-dep",
        name: "Bản đẹp",
        order: 3,
        textColor: null,
        backgroundColor: null,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Labels seeded");

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
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
