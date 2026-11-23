import assert from "node:assert/strict";
import { test } from "node:test";
import { contactProblem, readContact, thanksPath } from "../workers/contact.js";
import {
  githubForwardPath,
  isAllowedGithubPath,
  isPermissionProbe,
} from "../workers/github.js";

const REPO = "Alessandro-Arensi/rp-design-webpage";

test("thanks path rejects anything that is not a real thank-you page", () => {
  assert.equal(thanksPath("/contatti/grazie/"), "/contatti/grazie/");
  assert.equal(thanksPath("/en/contact/thanks/"), "/en/contact/thanks/");
  assert.equal(thanksPath("https://evil.example/"), "/contatti/grazie/");
  assert.equal(thanksPath("//evil.example"), "/contatti/grazie/");
});

test("contact fields drop line breaks and refuse an empty or spam submission", () => {
  const fields = readContact(
    new Map([
      ["name", "Ada\nLovelace"],
      ["email", "ada@example.com"],
      ["message", "Hello"],
      ["subject", "Ciao\r\nBcc: x"],
      ["next", "/en/contact/thanks/"],
      ["bot-field", ""],
    ]),
  );
  assert.equal(fields.name, "Ada Lovelace");
  assert.equal(fields.subject, "Ciao Bcc: x");
  assert.equal(fields.next, "/en/contact/thanks/");
  assert.equal(contactProblem(fields), null);
  assert.equal(
    contactProblem({ ...fields, email: "not-an-email" }),
    "Missing fields",
  );
  assert.equal(contactProblem({ ...fields, bot: "filled" }), null);
});

test("the CMS proxy only forwards this repo and the signed-in user lookup", () => {
  const ok = githubForwardPath(
    "https://www.robertopianastudio.com/api/cms/repos/Alessandro-Arensi/rp-design-webpage/contents/src?ref=main",
    REPO,
  );
  assert.equal(
    ok,
    "/repos/Alessandro-Arensi/rp-design-webpage/contents/src?ref=main",
  );
  assert.equal(
    githubForwardPath("https://www.robertopianastudio.com/api/cms/user", REPO),
    "/user",
  );
  assert.equal(
    githubForwardPath(
      "https://www.robertopianastudio.com/api/cms/repos/other/repo",
      REPO,
    ),
    null,
  );
  assert.equal(
    githubForwardPath(
      "https://www.robertopianastudio.com/api/cms/repos/Alessandro-Arensi/rp-design-webpage/../other",
      REPO,
    ),
    null,
  );
  assert.equal(isAllowedGithubPath("/user", REPO), true);
  assert.equal(
    isPermissionProbe(
      "/repos/Alessandro-Arensi/rp-design-webpage/collaborators/ada/permission",
      REPO,
    ),
    true,
  );
});
