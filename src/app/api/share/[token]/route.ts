import { NextRequest, NextResponse } from "next/server";
import { Query } from "appwrite";
import { getServerDatabases } from "@/lib/appwrite/server-client";
import { getDatabaseId, getCollectionId } from "@/env";

interface ShareLink {
  $id: string;
  token: string;
  boardId: string;
  workspaceId: string;
  isActive: boolean;
  expiresAt?: string | null;
}

/** Strip Appwrite internal fields from a document before sending to client */
function sanitize(doc: Record<string, unknown>): Record<string, unknown> {
  const { $permissions, $databaseId, $collectionId, ...rest } = doc;
  void $permissions;
  void $databaseId;
  void $collectionId;
  return rest;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || typeof token !== "string" || token.length > 128) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const db = getServerDatabases();
  const dbId = getDatabaseId();

  // 1. Look up the share link by token
  let shareLink: ShareLink;
  try {
    const result = await db.listDocuments(
      dbId,
      getCollectionId("share_links"),
      [Query.equal("token", token), Query.limit(1)],
    );

    if (result.documents.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    shareLink = result.documents[0] as unknown as ShareLink;
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Validate active + expiry
  if (!shareLink.isActive) {
    return NextResponse.json(
      { error: "Link has been revoked" },
      { status: 410 },
    );
  }
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  // 3. Fetch board
  let board: Record<string, unknown>;
  try {
    board = (await db.getDocument(
      dbId,
      getCollectionId("boards"),
      shareLink.boardId,
    )) as unknown as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  // 4. Fetch layers
  let layers: Record<string, unknown>[] = [];
  try {
    const layersResult = await db.listDocuments(
      dbId,
      getCollectionId("board_layers"),
      [Query.equal("boardId", shareLink.boardId), Query.limit(100)],
    );
    layers = layersResult.documents as unknown as Record<string, unknown>[];
  } catch {
    layers = [];
  }

  // 5. Fetch items for all layers
  let items: Record<string, unknown>[] = [];
  try {
    const itemsResult = await db.listDocuments(
      dbId,
      getCollectionId("board_items"),
      [Query.equal("boardId", shareLink.boardId), Query.limit(500)],
    );
    items = itemsResult.documents as unknown as Record<string, unknown>[];
  } catch {
    items = [];
  }

  return NextResponse.json(
    {
      board: sanitize(board),
      layers: layers.map(sanitize),
      items: items.map(sanitize),
    },
    {
      headers: {
        // Short cache — viewers see near-live board state
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
