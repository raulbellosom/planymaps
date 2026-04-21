import { notFound } from "next/navigation";
import type { Board, Layer, BoardItem } from "@/types/board";
import { ShareCanvas } from "./share-canvas";
import Image from "next/image";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

interface ShareData {
  board: Board;
  layers: Layer[];
  items: BoardItem[];
}

async function fetchShareData(token: string): Promise<ShareData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/share/${token}`, {
      // No caching at the page level — the API route handles its own cache headers
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const data = await fetchShareData(token);

  if (!data) {
    notFound();
  }

  return (
    <div className="h-dvh bg-(--navy-900) flex flex-col overflow-hidden">
      {/* Minimal header */}
      <header className="shrink-0 h-10 glass-panel border-b border-white/10 flex items-center px-4 gap-3">
        <div className="w-6 h-6">
          <Image
            src="/planymaps.svg"
            alt="Planymaps"
            width={41}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-(--gray-600) text-xs">|</span>
        <span className="text-(--gray-400) text-xs truncate">
          {data.board.name}
        </span>
        <span className="ml-auto text-(--gray-600) text-xs">
          Read-only view
        </span>
      </header>

      {/* Canvas area */}
      <div className="flex-1 overflow-hidden">
        <ShareCanvas
          board={data.board}
          layers={data.layers}
          items={data.items}
          token={token}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params;
  const data = await fetchShareData(token);
  return {
    title: data ? `${data.board.name} — Planymaps` : "Shared Board — Planymaps",
    robots: "noindex",
  };
}
