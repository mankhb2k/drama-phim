"use client";

import { useState, useEffect, useCallback } from "react";
import { MovieCard } from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 12;

type MovieItem = {
  slug: string;
  title: string;
  year: number | null;
  status: "ONGOING" | "COMPLETED";
  episodes: number;
};

type ApiResponse = {
  items: MovieItem[];
  total: number;
  limit: number;
  offset: number;
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
    </div>
  );
}

export function TongHopSection() {
  const [items, setItems] = useState<MovieItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    const res = await fetch(
      `/api/movies?limit=${PAGE_SIZE}&offset=${offset}&orderBy=createdAt`,
    );
    if (!res.ok) return;
    const data: ApiResponse = await res.json();
    if (append) {
      setItems((prev) => [...prev, ...data.items]);
    } else {
      setItems(data.items);
    }
    setTotal(data.total);
    return data;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPage(0, false).finally(() => setLoading(false));
  }, [fetchPage]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPage(items.length, true).finally(() => setLoadingMore(false));
  };

  const hasMore = items.length < total;

  return (
    <section>
      <SectionHeader title="Tổng Hợp" />
      <div className="mt-4">
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:gap-4 scrollbar-hide text-muted-foreground text-sm">
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có phim nào.</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:gap-4 scrollbar-hide">
              {items.map((movie: MovieItem) => (
                <MovieCard
                  key={movie.slug}
                  slug={movie.slug}
                  title={movie.title}
                  year={movie.year}
                  episodes={movie.episodes}
                  status={movie.status}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
