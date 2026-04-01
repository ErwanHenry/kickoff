import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Direct export of better-auth handler
export const { GET, POST } = toNextJsHandler(auth);
