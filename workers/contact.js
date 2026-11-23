// Contact form. Posts land here instead of Netlify Forms.
// The thank-you location is an allow-list so the `next` field cannot be
// turned into an open redirect.

export const THANKS_PATHS = new Set([
  "/contatti/grazie/",
  "/en/contact/thanks/",
]);

export function thanksPath(next) {
  const value = String(next || "");
  return THANKS_PATHS.has(value) ? value : "/contatti/grazie/";
}

export function cleanLine(value, max) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);
}

export function readContact(form) {
  return {
    bot: cleanLine(form.get("bot-field"), 200),
    name: cleanLine(form.get("name"), 200),
    email: cleanLine(form.get("email"), 200),
    message: String(form.get("message") || "")
      .replace(/\r/g, "")
      .trim()
      .slice(0, 10000),
    subject: cleanLine(form.get("subject"), 200),
    next: thanksPath(form.get("next")),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Null means "send it" (or, when `bot` is set, pretend it was sent).
export function contactProblem(fields) {
  if (fields.bot) return null;
  if (!fields.name || !fields.message || !EMAIL.test(fields.email))
    return "Missing fields";
  return null;
}

export function redirectTo(location) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export async function handleContact(request, env) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response("Missing fields", { status: 400 });
  }
  const fields = readContact(form);
  if (fields.bot) return redirectTo(fields.next);
  if (contactProblem(fields))
    return new Response("Missing fields", { status: 400 });
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM || !env.CONTACT_TO) {
    return new Response("Form mail is not configured", { status: 503 });
  }

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: fields.email,
      subject: fields.subject || "Nuovo messaggio dal sito",
      text: `Nome: ${fields.name}\nEmail: ${fields.email}\n\n${fields.message}`,
    }),
  });
  if (!sent.ok) {
    console.error("contact mail failed", sent.status);
    return new Response("Could not send the message", { status: 502 });
  }
  return redirectTo(fields.next);
}
