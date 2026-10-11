import assert from "node:assert/strict";
import test from "node:test";
import { getPublicationAuthors, getPublicationLink, hasPublicationContent } from "../src/lib/publication";
import { validateResume } from "../src/lib/resume-import-schema";
import { createResumeFromAIResult } from "../src/app/app/dashboard/resumes/utils";
import { generateResumeMarkdown } from "../src/utils/markdown";
import { initialResumeStateEn } from "../src/config/initialResumeData";
import type { Publication, ResumeData } from "../src/types/resume";

const publication = (patch: Partial<Publication> = {}): Publication => ({
  id: "p1", title: "", authors: "", highlightedAuthor: "", venue: "", date: "", status: "", link: "", description: "", visible: true, ...patch,
});

test("publication links accept http(s), DOIs and bare domains only", () => {
  assert.equal(getPublicationLink("10.1234/abc.5"), "https://doi.org/10.1234/abc.5");
  assert.equal(getPublicationLink("doi: 10.1234/abc"), "https://doi.org/10.1234/abc");
  assert.equal(getPublicationLink("arxiv.org/abs/2401.00001"), "https://arxiv.org/abs/2401.00001");
  assert.equal(getPublicationLink("https://example.com/paper"), "https://example.com/paper");
  for (const value of ["", "javascript:alert(1)", "ftp://example.com", "https://user:pw@example.com", "not a link"]) {
    assert.equal(getPublicationLink(value), null, value);
  }
});

test("authors split on semicolons/newlines and highlight ignores contribution markers", () => {
  assert.deepEqual(getPublicationAuthors("Lin, A.*; Wang, J.\nChen M.†", "lin, a."), [
    { name: "Lin, A.*", highlighted: true },
    { name: "Wang, J.", highlighted: false },
    { name: "Chen M.†", highlighted: false },
  ]);
  assert.ok(getPublicationAuthors("林知远；王晓", "").every((author) => !author.highlighted));
});

test("authors split supports Chinese comma and enumeration marks with highlight", () => {
  assert.deepEqual(getPublicationAuthors("张三，李四，王五", "李四"), [
    { name: "张三", highlighted: false },
    { name: "李四", highlighted: true },
    { name: "王五", highlighted: false },
  ]);
  assert.deepEqual(getPublicationAuthors("张三、李四*、王五", "李四"), [
    { name: "张三", highlighted: false },
    { name: "李四*", highlighted: true },
    { name: "王五", highlighted: false },
  ]);
});

test("empty publications are detected", () => {
  assert.equal(hasPublicationContent(publication()), false);
  assert.equal(hasPublicationContent(publication({ venue: " NeurIPS " })), true);
});

test("PDF import keeps publications and adds the section only when present", () => {
  const { resume } = validateResume({
    basic: { name: "Alex Lin" },
    publications: [{ title: "Paper", authors: "Alex Lin; Ming Chen", status: "guessed", description: ["Equal contribution"] }, {}],
  });
  assert.equal(resume.publications.length, 2);

  const created = createResumeFromAIResult(resume, "cv", "en");
  assert.equal(created.publications.length, 1);
  assert.equal(created.publications[0].status, "");
  assert.equal(created.publications[0].description, "Equal contribution");
  assert.equal(created.menuSections.at(-1)?.id, "publications");
  assert.equal(created.menuSections.at(-1)?.title, "Publications");

  const withoutPapers = createResumeFromAIResult({ basic: { name: "Alex" } }, "cv");
  assert.ok(!withoutPapers.menuSections.some((section) => section.id === "publications"));
});

test("markdown export renders visible publications with escaped text and safe links", () => {
  const resume = {
    ...initialResumeStateEn,
    id: "r1",
    title: "CV",
    createdAt: "",
    updatedAt: "",
    templateId: "classic",
    menuSections: [{ id: "publications", title: "Publications", icon: "publications", enabled: true, order: 0 }],
    publications: [
      publication({ title: "Learning *fast*", authors: "Alex Lin; Ming Chen", highlightedAuthor: "Alex Lin", venue: "NeurIPS", date: "2025", status: "accepted", link: "10.1234/x" }),
      publication({ id: "p2", title: "Hidden", visible: false }),
    ],
  } as unknown as ResumeData;

  const markdown = generateResumeMarkdown(resume, { locale: "en" });
  assert.match(markdown, /### Learning \\\*fast\\\*/);
  assert.match(markdown, /\*\*Alex Lin\*\*; Ming Chen/);
  assert.match(markdown, /NeurIPS \| 2025 \| Accepted/);
  const resumeZh = {
    ...resume,
    publications: [publication({ title: "论文", authors: "张三，李四，王五", highlightedAuthor: "李四" })],
  } as unknown as ResumeData;
  const markdownZh = generateResumeMarkdown(resumeZh, { locale: "zh" });
  assert.match(markdownZh, /张三，\*\*李四\*\*，王五/);
});
