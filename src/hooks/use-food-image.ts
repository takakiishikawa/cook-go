"use client";

import { useState, useEffect } from "react";

interface UseFoodImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: boolean;
}

export function useFoodImage(name: string | null): UseFoodImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!name);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!name) {
      setImageUrl(null);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    setImageUrl(null);
    fetch(`/api/pantry/image?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
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
  }, [name]);

  return { imageUrl, loading, error };
}
