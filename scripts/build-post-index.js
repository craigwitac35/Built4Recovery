#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const postsDir = path.join(repoRoot, 'content', 'posts');
const outputPath = path.join(postsDir, 'index.json');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const frontmatter = match[1];
  const content = match[2];
  const data = {};
  let currentArrayKey = null;

  for (const line of frontmatter.split('\n')) {
    if (!line.trim()) continue;

    const arrayItemMatch = line.match(/^\s*-\s*(.+)$/);
    if (arrayItemMatch && currentArrayKey) {
      data[currentArrayKey].push(stripQuotes(arrayItemMatch[1].trim()));
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const value = kvMatch[2].trim();

    if (value === '') {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    currentArrayKey = null;
    data[key] = parseScalar(value);
  }

  return { data, content };
}

function parseScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;

  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean);
  }

  return stripQuotes(value);
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function readPosts() {
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .sort();

  const posts = files.map((fileName) => {
    const filePath = path.join(postsDir, fileName);
    const fileData = fs.readFileSync(filePath, 'utf8');
    const { data } = parseFrontmatter(fileData);
    const slug = fileName.replace(/\.md$/, '');

    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      description: data.description || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      featured_image: data.featured_image || '',
      draft: Boolean(data.draft),
      filepath: `content/posts/${fileName}`,
    };
  });

  posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return posts;
}

const allPosts = readPosts();
const publishedPosts = allPosts.filter((post) => !post.draft);

fs.writeFileSync(outputPath, `${JSON.stringify(publishedPosts, null, 2)}\n`, 'utf8');
console.log(`Built ${publishedPosts.length} post(s) in content/posts/index.json`);
