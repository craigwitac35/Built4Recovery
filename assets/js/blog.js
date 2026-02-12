async function loadPosts() {
  const list = document.querySelector('#postList');
  if (!list) return;

  try {
    const res = await fetch('assets/data/posts.json', { cache: 'no-store' });
    const posts = await res.json();

    list.innerHTML = posts.map(p => {
      const tagHtml = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      return `
        <a class="post-card" href="post.html?slug=${encodeURIComponent(p.slug)}">
          <div class="meta">${escapeHtml(p.date)} · ${escapeHtml(p.readingTime || '')}</div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.excerpt)}</p>
          <div class="tag-row">${tagHtml}</div>
        </a>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div class="post-card">Could not load posts yet.</div>`;
  }
}

async function loadPost() {
  const titleEl = document.querySelector('#postTitle');
  const metaEl = document.querySelector('#postMeta');
  const bodyEl = document.querySelector('#postBody');
  if (!titleEl || !metaEl || !bodyEl) return;

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) {
    titleEl.textContent = 'Post not found';
    bodyEl.innerHTML = '<p class="muted">No slug provided.</p>';
    return;
  }

  try {
    const res = await fetch('assets/data/posts.json', { cache: 'no-store' });
    const posts = await res.json();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      titleEl.textContent = 'Post not found';
      bodyEl.innerHTML = '<p class="muted">That post does not exist yet.</p>';
      return;
    }

    titleEl.textContent = post.title;
    metaEl.textContent = `${post.date} · ${post.readingTime || ''}`;

    // Simple placeholder body. Later we can load markdown or HTML per post.
    bodyEl.innerHTML = `
      <blockquote>${escapeHtml(post.excerpt)}</blockquote>
      <p>This is a starter post page. If you want, we can switch to markdown posts so you can write fast and keep everything clean.</p>
      <p>Built4Recovery is about becoming the kind of man who keeps showing up. Not perfect. Just consistent.</p>
      <div class="hr"></div>
      <p class="muted">Tags: ${(post.tags || []).map(escapeHtml).join(', ')}</p>
    `;
  } catch (e) {
    titleEl.textContent = 'Post not found';
    bodyEl.innerHTML = '<p class="muted">Could not load post.</p>';
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}

loadPosts();
loadPost();
