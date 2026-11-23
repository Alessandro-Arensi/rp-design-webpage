// Proxies Decap's GitHub calls. The publishing token lives in GITHUB_TOKEN
// and is attached here. Callers must already have passed the email-code login.

import { hasAccess } from "./access.js";
import { githubForwardPath, isPermissionProbe } from "./github.js";

const WRITE_PERMISSION = JSON.stringify({ permission: "write" });

export async function handleCms(request, env) {
  if (!(await hasAccess(request, env))) {
    return Response.json(
      { message: "Email login is required." },
      { status: 401 },
    );
  }
  if (!env.GITHUB_TOKEN || !env.CMS_REPO) {
    return Response.json(
      { message: "The editor is not configured yet." },
      { status: 503 },
    );
  }

  const forward = githubForwardPath(request.url, env.CMS_REPO);
  if (!forward) return Response.json({ message: "Not found" }, { status: 404 });

  const pathOnly = forward.split("?")[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch {
    return Response.json({ message: "Not found" }, { status: 404 });
  }
  if (isPermissionProbe(decoded, env.CMS_REPO)) {
    return new Response(WRITE_PERMISSION, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");
  if (accept) headers.set("accept", accept);
  if (contentType) headers.set("content-type", contentType);
  headers.set("authorization", `Bearer ${env.GITHUB_TOKEN}`);
  headers.set("user-agent", "rp-design-cms");
  headers.set("x-github-api-version", "2022-11-28");

  const init = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD")
    init.body = request.body;

  const upstream = await fetch(`https://api.github.com${forward}`, init);
  const out = new Headers();
  const type = upstream.headers.get("content-type");
  if (type) out.set("content-type", type);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
