import "dotenv/config";
import { buildEpisodeSlug } from "@/lib/watch-slug";
import { prisma } from "@/lib/prisma";
import { getR2Config } from "@/lib/r2";

async function main() {
  const r2PublicBaseUrl = (() => {
    try {
      return getR2Config().publicBaseUrl;
    } catch {
      return null;
    }
  })();

  const movies = await prisma.movie.findMany({
    select: {
      id: true,
      channel: true,
      episodes: {
        select: {
          id: true,
          episodeNumber: true,
          watchSlug: true,
          servers: {
            select: {
              id: true,
              embedUrl: true,
              playbackUrl: true,
              objectKey: true,
              sourceType: true,
              storageProvider: true,
            },
          },
        },
      },
    },
  });

  for (const movie of movies) {
    if (!movie.channel) {
      await prisma.movie.update({
        where: { id: movie.id },
        data: { channel: "nsh" },
      });
    }

    for (const episode of movie.episodes) {
      if (!episode.watchSlug) {
        await prisma.episode.update({
          where: { id: episode.id },
          data: { watchSlug: buildEpisodeSlug(episode.episodeNumber) },
        });
      }

      for (const server of episode.servers) {
        const isR2Object =
          Boolean(server.objectKey) ||
          (r2PublicBaseUrl != null &&
            server.embedUrl.startsWith(`${r2PublicBaseUrl}/`));
        const playbackUrl = server.playbackUrl ?? server.embedUrl;

        await prisma.server.update({
          where: { id: server.id },
          data: {
            playbackUrl,
            sourceType: isR2Object ? "DIRECT_VIDEO" : "EMBED",
            storageProvider: isR2Object ? "R2" : "EXTERNAL",
          },
        });
      }
    }
  }

  console.log(`Backfill done. Processed ${movies.length} movies.`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
