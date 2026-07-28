// Contact form → Netlify email subject. Netlify uses a submitted field named
// `subject` as the notification email's subject line. The template ships a
// static fallback in `value` (what a no-JS submit sends) plus a {name} template
// in data-subject-template; when JS runs we substitute the name the visitor
// typed, set just before the native POST. Progressive enhancement.
export function initContactForm() {
  const form = document.querySelector('form[name="contact"]');
  if (!form) return; // not the contact page
  const subject = form.querySelector('input[name="subject"]');
  const nameInput = form.querySelector('input[name="name"]');
  const template = subject?.dataset.subjectTemplate;
  if (!nameInput || !template) return;

  form.addEventListener("submit", () => {
    const name = nameInput.value.trim();
    if (name) subject.value = template.replace("{name}", name);
  });
}
