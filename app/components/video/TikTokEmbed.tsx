'use client';

import { useEffect, useRef } from 'react';

interface TikTokEmbedProps {
  videoUrl: string;
  videoId: string;
}

export default function TikTokEmbed({ videoUrl, videoId }: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const blockquote = document.createElement('blockquote');
    blockquote.className = 'tiktok-embed';
    blockquote.setAttribute('cite', videoUrl);
    blockquote.setAttribute('data-video-id', videoId);
    blockquote.style.maxWidth = '605px';
    blockquote.style.minWidth = '325px';
    blockquote.innerHTML = '<section></section>';
    container.appendChild(blockquote);

    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [videoUrl, videoId]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center [&_blockquote]:m-0!"
    />
  );
}
