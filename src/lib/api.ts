import { NextRequest, NextResponse } from "next/server";

/**
 * Read a JSON request body without letting a malformed or missing one bubble
 * up as a 500. Returns the parsed value, or a ready-to-return 400 response.
 */
export async function readJsonBody(
  request: NextRequest
): Promise<{ data: unknown; error: null } | { data: null; error: NextResponse }> {
  try {
    return { data: await request.json(), error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}
