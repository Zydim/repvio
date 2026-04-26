import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const email = session.user.email;
  const timestamp = Date.now().toString();
  const secret = process.env.BACKEND_SECRET ?? "";
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${email}:${timestamp}`)
    .digest("hex");

  return Response.json({ email, token: `${timestamp}:${sig}` });
}
