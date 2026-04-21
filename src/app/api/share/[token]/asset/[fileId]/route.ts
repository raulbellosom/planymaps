import { NextRequest, NextResponse } from "next/server";
import { Query } from "appwrite";
import {
  getServerDatabases,
  getServerStorage,
} from "@/lib/appwrite/server-client";
import { getDatabaseId, getCollectionId, getBucketId } from "@/env";

interface ShareLink {
  isActive: boolean;
  expiresAt?: string | null;
  boardId: string;
}

async function validateToken(token: string): Promise<ShareLink | null> {
  const db = getServerDatabases();
  try {
    const result = await db.listDocuments(
      getDatabaseId(),
      getCollectionId("share_links"),
      [Query.equal("token", token), Query.limit(1)],
    );
    if (result.documents.length === 0) return null;
    return result.documents[0] as unknown as ShareLink;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> },
) {
  const { token, fileId } = await params;

  if (
    !token ||
    typeof token !== "string" ||
    token.length > 128 ||
    !fileId ||
    typeof fileId !== "string" ||
    fileId.length > 256
  ) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  // Validate share link
  const shareLink = await validateToken(token);
  if (!shareLink) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!shareLink.isActive) {
    return new NextResponse("Link revoked", { status: 410 });
  }
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return new NextResponse("Link expired", { status: 410 });
  }

  // Fetch the file via the API key client and stream it to the response
  try {
    const storage = getServerStorage();
    const bucketId = getBucketId("board_assets");

    // getFileDownload returns a URL — we need to fetch through Appwrite SDK
    // Use the underlying URL + API key headers to stream the file
    const fileInfo = await storage.getFile(bucketId, fileId);

    // Build the direct download URL using the Appwrite endpoint
    const { publicEnv, serverEnv } = await import("@/env");
    const endpoint = publicEnv.appwriteEndpoint!;
    const projectId = publicEnv.appwriteProjectId!;
    const apiKey = serverEnv.appwriteApiKey!;

    const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`;

    const upstream = await fetch(fileUrl, {
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      },
    });

    if (!upstream.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      fileInfo.mimeType || "application/octet-stream",
    );
    headers.set("Content-Length", String(fileInfo.sizeOriginal));
    // Cache asset proxies for 1 hour — assets don't change once uploaded
    headers.set("Cache-Control", "public, max-age=3600, immutable");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
