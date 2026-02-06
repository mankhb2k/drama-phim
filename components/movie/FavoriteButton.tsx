"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  slug: string;
  className?: string;
}

export function FavoriteButton({ slug, className }: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user);
  const [movieId, setMovieId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/movies/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { id: number } | null) => {
        if (data?.id) setMovieId(data.id);
      })
      .catch(() => {});
  }, [user, slug]);

  useEffect(() => {
    if (!user || !movieId) return;
    fetch("/api/profile/favorites", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { items?: { movieId: number }[] }) => {
        const list = data.items ?? [];
        setIsFavorite(list.some((f) => f.movieId === movieId));
      })
      .catch(() => {});
  }, [user, movieId]);

  const handleClick = async () => {
    if (!user || movieId == null || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setIsFavorite(data.added === true);
    } finally {
      setLoading(false);
    }
  };

  if (!user || movieId == null) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleClick}
      disabled={loading}
      aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      <Heart
        className={cn("size-4", isFavorite && "fill-current text-destructive")}
      />
      {isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
    </Button>
  );
}
