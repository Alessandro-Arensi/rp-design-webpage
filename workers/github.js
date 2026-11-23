// Which GitHub API paths the CMS proxy may forward.
// The browser never receives the publishing token; it only calls /api/cms/*,
// and this list is the whole of what that token is allowed to touch.

export function githubForwardPath(requestUrl, repo) {
  const marker = "/api/cms";
  const idx = requestUrl.indexOf(marker);
  if (idx === -1) return null;
  const rest = requestUrl.slice(idx + marker.length);
  if (!rest.startsWith("/")) return null;

  const pathOnly = rest.split("?")[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch {
    return null;
  }
  if (!isAllowedGithubPath(decoded, repo)) return null;
  return rest;
}

export function isAllowedGithubPath(decoded, repo) {
  if (
    !repo ||
    decoded.includes("..") ||
    decoded.includes("\\") ||
    decoded.includes("//")
  ) {
    return false;
  }
  if (decoded === "/user") return true;
  const root = `/repos/${repo}`;
  return decoded === root || decoded.startsWith(`${root}/`);
}

// Decap refuses to open the editor unless GitHub says the logged-in user can
// write. A fine-grained token often cannot read the collaborators endpoint
// even when it can commit. The proxy answers that one probe itself.
export function isPermissionProbe(decoded, repo) {
  if (!isAllowedGithubPath(decoded, repo)) return false;
  const prefix = `/repos/${repo}/collaborators/`;
  return decoded.startsWith(prefix) && decoded.endsWith("/permission");
}
