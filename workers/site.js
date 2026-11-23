// Runs only for /api/* (see wrangler.toml run_worker_first).
// Every other request is a static file and is not billed.

import { handleAuth } from "./auth.js";
import { handleCms } from "./cms.js";
import { handleContact } from "./contact.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleContact(request, env);
    if (pathname === "/api/auth" || pathname === "/api/auth/")
      return handleAuth(request, env);
    if (pathname === "/api/cms" || pathname.startsWith("/api/cms/"))
      return handleCms(request, env);
    return new Response("Not found", { status: 404 });
  },
};
