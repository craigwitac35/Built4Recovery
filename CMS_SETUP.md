# Built4Recovery Blog + Decap CMS Setup

## What is included in this repo now
- Decap CMS scaffold at `/admin`.
- Markdown post content model under `/content/posts`.
- Static blog list page at `/blog/index.html`.
- Static single post page at `/blog/post.html?slug=...`.
- Post index generator script at `/scripts/build-post-index.js`.
- GitHub Action to auto-build `/content/posts/index.json` on push.

## 1) Enable GitHub Pages (if not already)
1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source = Deploy from a branch**.
3. Choose your publishing branch (usually `main`) and folder `/ (root)`.
4. Save and wait for Pages to publish.

## 2) Access the CMS
1. Visit `https://<your-username>.github.io/Built4Recovery/admin/`.
2. You should see the Decap CMS login screen.

## 3) Authentication options (GitHub Pages hosting)

GitHub Pages cannot provide OAuth callbacks by itself for Decap CMS. Use one of these:

### Option A (Primary): Netlify auth only + keep GitHub Pages hosting
Use Netlify Identity + Git Gateway only for CMS auth, while public site stays on GitHub Pages.

Steps:
1. Create a free Netlify site connected to this same GitHub repo.
2. In Netlify site settings, enable **Identity** and **Git Gateway**.
3. Under Identity settings, add your admin user/invite email.
4. In Netlify, copy your site URL (for example `https://b4r-cms-auth.netlify.app`).
5. In `admin/config.yml`, set:
   - `backend.name: git-gateway`
   - keep the rest of collections/media settings the same.
6. Keep `admin/index.html` as-is (Decap CDN script).
7. Add `admin/` and the content folders to this repo (already done).
8. Continue to publish the main site from GitHub Pages as usual.

Files used:
- `admin/index.html`
- `admin/config.yml`

### Option B: GitHub App / external OAuth proxy
Use Decap `github` backend with a separate OAuth service for callback/token exchange.

Steps:
1. Keep `backend.name: github` in `admin/config.yml`.
2. Register a GitHub OAuth App or GitHub App with callback URL from your auth service.
3. Deploy an OAuth proxy service (examples: Decap auth server, a small serverless function, or any trusted external auth service).
4. Configure proxy service with GitHub client ID/secret and allowed repo.
5. In `admin/config.yml`, set:
   - `base_url`: your auth service URL
   - `auth_endpoint`: endpoint path exposed by the auth service
6. Ensure callback URL and CORS/origin settings include your GitHub Pages domain.

Files used:
- `admin/config.yml`
- OAuth service config (external; not in this repo)

## 4) Create first post and see it on /blog
1. Open `/Built4Recovery/admin/` and log in.
2. Go to **Posts** collection.
3. Create a new post with required fields:
   - title
   - date
   - description
   - tags
   - featured_image (optional)
   - draft (true/false)
4. Publish/save entry. This creates a Markdown file in `/content/posts/`.
5. GitHub Action runs automatically and updates `/content/posts/index.json`.
6. Open `/Built4Recovery/blog/` to see the post list.
7. Open `/Built4Recovery/blog/post.html?slug=<slug>` to view the full post page.

## Local fallback (manual index build)
If needed before pushing:
```bash
node scripts/build-post-index.js
```
Commit the updated `content/posts/index.json`.
