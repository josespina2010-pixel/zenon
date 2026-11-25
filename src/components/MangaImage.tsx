import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface MangaImageProps {
  src: string;
  alt: string;
  className?: string;
  title?: string;
}

export function MangaImage({
  src,
  alt,
  className = '',
  title,
}: MangaImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-[#14090B] to-zinc-950 p-6 text-center ${className}`}
      >
        <BookOpen className="mb-3 h-10 w-10 text-red-600/80" aria-hidden="true" />
        <span className="font-display text-sm font-semibold tracking-wide text-zinc-200">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
