import { Client } from "@notionhq/client";
import fs from "node:fs/promises";
import path from "node:path";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN) {
  throw new Error("Missing NOTION_TOKEN");
}

if (!DATABASE_ID) {
  throw new Error("Missing NOTION_DATABASE_ID");
}

const notion = new Client({
  auth: NOTION_TOKEN,
});

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

function getPlainText(items = []) {
  return items.map((item) => item.plain_text ?? "").join("");
}

function getProperty(page, name) {
  return page.properties?.[name];
}

function getTitle(page) {
  const property = Object.values(page.properties ?? {}).find(
    (p) => p.type === "title"
  );

  return getPlainText(property?.title ?? []);
}

function getTextProperty(page, name) {
  const property = getProperty(page, name);

  if (!property) return "";

  if (property.type === "rich_text") {
    return getPlainText(property.rich_text);
  }

  if (property.type === "title") {
    return getPlainText(property.title);
  }

  return "";
}

function getSelectProperty(page, name) {
  const property = getProperty(page, name);

  if (!property) return "";

  if (property.type === "select") {
    return property.select?.name ?? "";
  }

  if (property.type === "status") {
    return property.status?.name ?? "";
  }

  return "";
}

function getDateProperty(page, name) {
  const property = getProperty(page, name);

  if (!property || property.type !== "date") {
    return "";
  }

  return property.date?.start ?? "";
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

async function getAllPages(dataSourceId) {
  const pages = [];
  let start_cursor = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      ...(start_cursor ? { start_cursor } : {}),
    });

    pages.push(...response.results);

    start_cursor = response.has_more
      ? response.next_cursor
      : undefined;
  } while (start_cursor);

  return pages;
}

async function getPageMarkdown(pageId) {
  return notion.pages.retrieveMarkdown({
    page_id: pageId,
  });
}

async function main() {
  console.log("Connecting to Notion...");

  // A Notion database can contain one or more data sources.
  const database = await notion.databases.retrieve({
    database_id: DATABASE_ID,
  });

  const dataSources = database.data_sources ?? [];

  if (dataSources.length === 0) {
    throw new Error("No data source found inside the Notion database.");
  }

  const dataSourceId = dataSources[0].id;

  console.log(`Using data source: ${dataSourceId}`);

  const pages = await getAllPages(dataSourceId);

  console.log(`Found ${pages.length} page(s).`);

  await fs.mkdir(BLOG_DIR, { recursive: true });

  const publishedSlugs = new Set();

  for (const page of pages) {
    const status = getSelectProperty(page, "Status");

    if (status !== "Published") {
      console.log(`Skipping draft: ${getTitle(page)}`);
      continue;
    }

    const title = getTitle(page);

    if (!title) {
      console.warn(`Skipping page without title: ${page.id}`);
      continue;
    }

    const date =
      getDateProperty(page, "Date") ||
      page.created_time?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10);

    const category = getSelectProperty(page, "Category");
    const description = getTextProperty(page, "Description");

    const notionSlug = getTextProperty(page, "Slug");
    const slug = slugify(notionSlug || title);

    publishedSlugs.add(slug);

    console.log(`Syncing: ${title} → ${slug}`);

    const markdownResponse = await getPageMarkdown(page.id);

    let content = markdownResponse.markdown ?? "";

    // Avoid displaying the title twice if Notion returns it as an H1.
    const firstLine = content.split("\n")[0]?.trim();

    if (firstLine === `# ${title}`) {
      content = content.split("\n").slice(1).join("\n").trim();
    }

    const frontmatter = [
      "---",
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description || title)}`,
      `pubDate: ${yamlString(date)}`,
      "---",
      "",
    ].join("\n");

    const fileContent = `${frontmatter}${content}\n`;

    const filePath = path.join(BLOG_DIR, `${slug}.md`);

    await fs.writeFile(filePath, fileContent, "utf8");

    console.log(`✓ Written ${filePath}`);
  }

  // Remove old generated posts that are no longer published.
  const existingFiles = await fs.readdir(BLOG_DIR);

  for (const file of existingFiles) {
    if (!file.endsWith(".md")) continue;

    // Don't touch the Astro starter's files yet.
    const starterFiles = new Set([
      "first-post.md",
      "second-post.md",
      "third-post.md",
      "markdown-style-guide.md",
    ]);

    if (starterFiles.has(file)) continue;

    const slug = file.replace(/\.md$/, "");

    if (!publishedSlugs.has(slug)) {
      await fs.unlink(path.join(BLOG_DIR, file));
      console.log(`✓ Removed unpublished post: ${file}`);
    }
  }

  console.log("Notion sync complete.");
}

main().catch((error) => {
  console.error("\n❌ Notion sync failed:");
  console.error(error);
  process.exit(1);
});