function getBasePath() {
  const repoBase = '/Built4Recovery';
  if (window.location.pathname === repoBase || window.location.pathname.startsWith(`${repoBase}/`)) {
    return repoBase;
  }
  return '';
}

const BASE_PATH = getBasePath();
const INDEX_PATH = `${BASE_PATH}/content/posts/index.json`;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[s]));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: markdown };
  }

  const data = {};
  const frontmatter = match[1].split('\n');
  let currentArrayKey = null;

  frontmatter.forEach((line) => {
    if (!line.trim()) return;

    const itemMatch = line.match(/^\s*-\s*(.+)$/);
    if (itemMatch && currentArrayKey) {
      data[currentArrayKey].push(itemMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      return;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) return;

    const [, key, rawValue] = kvMatch;
    const value = rawValue.trim();

    if (value === '') {
      data[key] = [];
      currentArrayKey = key;
      return;
    }

    currentArrayKey = null;

    if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
      return;
    }

    data[key] = value.replace(/^['"]|['"]$/g, '');
  });

  return { data, content: match[2] };
}

async function fetchPostIndex() {
  const response = await fetch(INDEX_PATH, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not fetch post index: ${response.status}`);
  }
  return response.json();
}

function renderPostCards(posts, withDescription = true) {
  return posts.map((post) => {
    const tags = (post.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join('');

    return `
      <article class="post-card">
        <div class="meta">${escapeHtml(formatDate(post.date))}</div>
        <h3><a href="${BASE_PATH}/blog/post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
        ${withDescription ? `<p>${escapeHtml(post.description || '')}</p>` : ''}
        <div class="tag-row">${tags}</div>
      </article>
    `;
  }).join('');
}

async function loadBlogIndex() {
  const postList = document.querySelector('#postList');
  if (!postList) return;

  try {
    const posts = await fetchPostIndex();
    postList.innerHTML = renderPostCards(posts, true);
  } catch (error) {
    postList.innerHTML = '<div class="post-card"><p>Could not load posts yet.</p></div>';
  }
}

async function loadLatestPosts() {
  const latestPosts = document.querySelector('#latestPosts');
  if (!latestPosts) return;

  try {
    const posts = await fetchPostIndex();
    latestPosts.innerHTML = renderPostCards(posts.slice(0, 3), true);
  } catch (error) {
    latestPosts.innerHTML = '<div class="post-card"><p>Latest posts will appear here soon.</p></div>';
  }
}

async function loadSinglePost() {
  const titleEl = document.querySelector('#postTitle');
  const metaEl = document.querySelector('#postMeta');
  const tagsEl = document.querySelector('#postTags');
  const bodyEl = document.querySelector('#postBody');
  if (!titleEl || !metaEl || !bodyEl || !tagsEl) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    titleEl.textContent = 'Post not found';
    bodyEl.innerHTML = '<p class="muted">No post slug was provided.</p>';
    return;
  }

  try {
    const posts = await fetchPostIndex();
    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      titleEl.textContent = 'Post not found';
      bodyEl.innerHTML = '<p class="muted">That post does not exist yet.</p>';
      return;
    }

    const markdownResponse = await fetch(`${BASE_PATH}/${post.filepath}`, { cache: 'no-store' });
    if (!markdownResponse.ok) {
      throw new Error('Could not load markdown post');
    }

    const markdown = await markdownResponse.text();
    const parsed = parseFrontmatter(markdown);

    titleEl.textContent = parsed.data.title || post.title;
    metaEl.textContent = formatDate(parsed.data.date || post.date);
    tagsEl.innerHTML = (parsed.data.tags || post.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join('');

    if (parsed.data.featured_image) {
      bodyEl.innerHTML = `<img src="${escapeHtml(parsed.data.featured_image)}" alt="${escapeHtml(parsed.data.title || post.title)}" class="featured-image" />`;
    } else {
      bodyEl.innerHTML = '';
    }

    bodyEl.innerHTML += marked.parse(parsed.content);
  } catch (error) {
    titleEl.textContent = 'Post not found';
    bodyEl.innerHTML = '<p class="muted">Could not load post content.</p>';
  }
}

loadBlogIndex();
loadLatestPosts();
loadSinglePost();
