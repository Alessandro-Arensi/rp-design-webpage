// Decap's GitHub login is a popup handshake. This page completes that
// handshake without sending the editor to GitHub. The token in the message
// is a placeholder: the CMS proxy ignores it and uses the server token,
// and only after Access has already checked the email.

import { hasAccess } from "./access.js";

const PAGE = `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <title>Accesso</title>
  </head>
  <body>
    <p>Apertura dell'editor…</p>
    <script>
      (function () {
        var origin = window.location.origin;
        if (!window.opener) return;
        window.addEventListener("message", function (event) {
          if (event.origin !== origin || event.data !== "authorizing:github") return;
          var body = JSON.stringify({ token: "access", provider: "github" });
          window.opener.postMessage("authorization:github:success:" + body, origin);
        });
        window.opener.postMessage("authorizing:github", origin);
      })();
    </script>
  </body>
</html>`;

export async function handleAuth(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!(await hasAccess(request, env))) {
    return new Response("Email login is required before the editor can open.", {
      status: 401,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(request.method === "HEAD" ? null : PAGE, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
