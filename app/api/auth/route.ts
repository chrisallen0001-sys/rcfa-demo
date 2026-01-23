import { NextResponse } from "next/server";
import { createHmac } from "crypto";

// Generate a signed auth token
function generateToken(secret: string): string {
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

// Verify a signed auth token (exported for use in other routes)
export function verifyToken(token: string, secret: string): boolean {
  try {
    const [timestamp, signature] = token.split(".");
    if (!timestamp || !signature) return false;

    // Verify signature
    const expectedSignature = createHmac("sha256", secret)
      .update(timestamp)
      .digest("hex");

    if (signature !== expectedSignature) return false;

    // Check token age (24 hour expiry)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    const expectedPassword = process.env.APP_PASSWORD;
    const tokenSecret = process.env.AUTH_TOKEN_SECRET;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: "Server configuration error: password not set" },
        { status: 500 }
      );
    }

    if (!tokenSecret) {
      return NextResponse.json(
        { error: "Server configuration error: token secret not set" },
        { status: 500 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Check password
    if (password !== expectedPassword) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Generate token
    const token = generateToken(tokenSecret);

    // Return token in httpOnly cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Authentication failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
