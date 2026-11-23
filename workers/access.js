// Cloudflare Access proves the editor's email before the CMS proxy will
// attach the publishing token. A request that did not pass Access has no
// usable JWT, and the token stays unused.

const certsByTeam = new Map();

function decodeBase64Url(value) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function audienceMatches(aud, expected) {
  if (Array.isArray(aud)) return aud.includes(expected);
  return aud === expected;
}

async function certs(teamDomain) {
  const cached = certsByTeam.get(teamDomain);
  if (cached) return cached;
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error("Could not load Access certificates");
  const body = await response.json();
  certsByTeam.set(teamDomain, body.keys || []);
  return body.keys || [];
}

export async function hasAccess(request, env) {
  const team = env.ACCESS_TEAM_DOMAIN;
  const expectedAud = env.ACCESS_AUD;
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!team || !expectedAud || !jwt) return false;

  const parts = jwt.split(".");
  if (parts.length !== 3) return false;
  let header;
  let payload;
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  } catch {
    return false;
  }
  if (header.alg !== "RS256" || !header.kid) return false;
  if (!audienceMatches(payload.aud, expectedAud)) return false;
  if (payload.iss !== `https://${team}`) return false;
  if (!payload.exp || payload.exp * 1000 < Date.now()) return false;

  let keys;
  try {
    keys = await certs(team);
  } catch {
    return false;
  }
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) return false;
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    decodeBase64Url(parts[2]),
    signed,
  );
}
