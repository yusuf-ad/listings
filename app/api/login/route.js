import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const expectedUsername = process.env.ADMIN_USERNAME || "ana";
    const expectedPassword = process.env.ADMIN_PASSWORD || "test";

    if (username === expectedUsername && password === expectedPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set session cookie valid for 1 day
      response.cookies.set({
        name: "session",
        value: "authenticated",
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day in seconds
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
