function getFirstText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }
  return null;
}

function sanitizeText(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\s+/g, " ").trim() || null;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function findJobPostingJsonLd() {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

  for (const script of scripts) {
    const parsed = safeJsonParse(script.textContent || "");
    if (!parsed) continue;

    const candidates = asArray(parsed).flatMap((item) => {
      if (!item) return [];
      if (Array.isArray(item["@graph"])) return item["@graph"];
      return [item];
    });

    const jobPosting = candidates.find(
      (item) => item && item["@type"] && String(item["@type"]).toLowerCase() === "jobposting"
    );

    if (jobPosting) return jobPosting;
  }

  return null;
}

function textFromNode(node) {
  return node?.textContent?.replace(/\s+/g, " ").trim() || null;
}

function findByLabel(labelRegex) {
  const labels = Array.from(document.querySelectorAll("label, dt, strong, b"));
  for (const label of labels) {
    const text = textFromNode(label);
    if (!text || !labelRegex.test(text)) continue;

    const parentText = textFromNode(label.parentElement);
    if (parentText && parentText.length > text.length) {
      return parentText.replace(text, "").replace(/^[:\-\s]+/, "").trim() || null;
    }

    const next = label.nextElementSibling;
    const nextText = textFromNode(next);
    if (nextText) return nextText;
  }
  return null;
}

function findExperienceFromPageText() {
  const bodyText = document.body?.innerText || "";
  const match = bodyText.match(/\b\d+\s*(?:\+)?\s*[-to]{1,3}\s*\d+\s*(?:\+)?\s*(?:years?|yrs?)\b/i)
    || bodyText.match(/\b\d+\s*(?:\+)?\s*(?:years?|yrs?)\b/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function findDescriptionText() {
  const article = document.querySelector("article");
  if (article) {
    const t = textFromNode(article);
    if (t && t.length > 300) return t;
  }

  const main = document.querySelector("main");
  if (main) {
    const t = textFromNode(main);
    if (t && t.length > 300) return t;
  }

  const paragraphs = Array.from(document.querySelectorAll("p"))
    .map((p) => textFromNode(p))
    .filter(Boolean)
    .join("\n");
  return paragraphs || null;
}

function findKeySkills(jobPosting) {
  if (jobPosting?.skills) {
    return asArray(jobPosting.skills)
      .map((skill) => sanitizeText(skill))
      .filter(Boolean);
  }

  const skillNodes = Array.from(
    document.querySelectorAll(
      "[class*='skill'], [data-testid*='skill'], [itemprop='skills'], a[href*='-jobs']"
    )
  );
  const skillSet = new Set();
  for (const node of skillNodes) {
    const text = sanitizeText(node.textContent);
    if (text && text.length <= 60) skillSet.add(text);
  }

  return Array.from(skillSet);
}

function extractRawData(jobPosting) {
  const employmentType = sanitizeText(
    jobPosting?.employmentType || findByLabel(/employment\s*type/i)
  );
  const posted = sanitizeText(jobPosting?.datePosted || findByLabel(/posted/i));
  const openings = sanitizeText(findByLabel(/openings?/i));
  const mode =
    sanitizeText(findByLabel(/work\s*mode|remote|hybrid|wfh|onsite|on-site/i)) ||
    sanitizeText(getFirstText(["[data-testid*='mode']", "[class*='wfh']"]));
  const salary = sanitizeText(
    (jobPosting?.baseSalary &&
      (typeof jobPosting.baseSalary?.value === "object"
        ? jobPosting.baseSalary.value?.value
        : jobPosting.baseSalary?.value)) ||
      findByLabel(/salary|ctc|pay/i)
  );

  const role = sanitizeText(jobPosting?.responsibilities || findByLabel(/^role\b/i));
  const industry = sanitizeText(jobPosting?.industry || findByLabel(/industry/i));
  const department = sanitizeText(findByLabel(/department/i));
  const education = sanitizeText(
    (jobPosting?.qualifications &&
      (typeof jobPosting.qualifications === "object"
        ? jobPosting.qualifications?.educationalLevel
        : jobPosting.qualifications)) ||
      findByLabel(/education|qualification/i)
  );
  const applicants = sanitizeText(findByLabel(/applicants?/i));

  return {
    openings,
    mode,
    posted,
    key_skills: findKeySkills(jobPosting),
    employment_type: employmentType,
    salary,
    role,
    industry,
    department,
    education,
    applicants
  };
}

function extractJobData() {
  const jobPosting = findJobPostingJsonLd();

  const title =
    jobPosting?.title ||
    getFirstText(["h1", "[role='heading'][aria-level='1']", "meta[property='og:title']"]) ||
    document.title?.split("|")[0]?.trim() ||
    null;

  const company =
    (typeof jobPosting?.hiringOrganization === "object"
      ? jobPosting?.hiringOrganization?.name
      : jobPosting?.hiringOrganization) ||
    findByLabel(/company/i) ||
    getFirstText(["meta[property='og:site_name']", "[itemprop='hiringOrganization']"]) ||
    null;

  const locationFromLd = (() => {
    const loc = jobPosting?.jobLocation?.address?.addressLocality;
    if (!loc) return null;
    return Array.isArray(loc) ? loc.join(", ") : String(loc);
  })();

  const location =
    locationFromLd ||
    findByLabel(/location/i) ||
    getFirstText(["[itemprop='jobLocation']", "[data-testid*='location']"]) ||
    null;

  const experience =
    (jobPosting?.experienceRequirements &&
      String(jobPosting.experienceRequirements.monthsOfExperience || "")) ||
    findByLabel(/experience/i) ||
    findExperienceFromPageText();

  const description =
    jobPosting?.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
    findDescriptionText();

  return {
    title,
    company,
    location,
    experience,
    description,
    job_url: window.location.href,
    raw_data: extractRawData(jobPosting)
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "EXTRACT_JOB") {
        const data = extractJobData();
        sendResponse(data);
    }
});