"use client";

import { useState, useEffect } from "react";

interface UseFoodImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: boolean;
}

export function useFoodImage(query: string | null): UseFoodImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) {
      setImageUrl(null);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    setImageUrl(null);
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d: { imageUrl: string | null }) => {
        if (!cancelled) {
          setImageUrl(d.imageUrl ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [query]);

  return { imageUrl, loading, error };
}
