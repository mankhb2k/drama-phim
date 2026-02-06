import { prisma } from "@/lib/prisma";

export default async function DashboardTagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { movies: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Tag</h1>
        <p className="text-muted-foreground">{tags.length} tag</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium text-foreground">Tên</th>
                <th className="px-4 py-3 font-medium text-foreground">Slug</th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Thứ tự
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Số phim
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Chưa có tag.
                  </td>
                </tr>
              ) : (
                tags.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.order}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t._count.movies}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
