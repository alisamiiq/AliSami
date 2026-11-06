import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

// Load .env.local
let token = process.env.GITHUB_TOKEN;
let repo = process.env.GITHUB_REPO || 'alisamiiq/AliSami';
let branch = process.env.GITHUB_BRANCH || 'main';

if (!token && existsSync('.env.local')) {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (key === 'GITHUB_TOKEN') token = val;
      if (key === 'GITHUB_REPO') repo = val;
      if (key === 'GITHUB_BRANCH') branch = val;
    }
  }
}

if (!token) {
  console.error('Error: GITHUB_TOKEN is not defined in .env.local');
  process.exit(1);
}

const commitMsg = process.argv[2] || `Update site: ${new Date().toISOString()}`;

const IGNORED = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  '.git',
  '.gemini',
  '.env',
  '.env.local',
  '.DS_Store'
]);

// Paths owned by the Telegram bot on GitHub — never overwritten from the local copy.
const REMOTE_OWNED = ['public/blog'];

function getFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORED.has(entry) || entry.endsWith('.log')) continue;
    const full = join(dir, entry);
    const rel = relative('.', full).replace(/\\/g, '/');
    if (REMOTE_OWNED.some((p) => rel === p || rel.startsWith(p + '/'))) continue;
    const s = statSync(full);
    if (s.isDirectory()) {
      result.push(...getFiles(full));
    } else {
      result.push(full);
    }
  }
  return result;
}

async function gh(endpoint, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${repo}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AliSami-Sync',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API Error ${res.status} on ${endpoint}: ${err}`);
  }
  return res.json();
}

async function main() {
  console.log(`🚀 Syncing with GitHub [${repo}] on branch [${branch}]...`);

  // 1. Get latest commit SHA
  const ref = await gh(`/git/ref/heads/${branch}`);
  const latestCommitSha = ref.object.sha;
  console.log(`Latest commit: ${latestCommitSha.substring(0, 7)}`);

  // 2. Scan project files
  const files = getFiles('.');
  console.log(`Found ${files.length} project files to sync.`);

  // 3. Upload blobs
  const treeItems = [];
  for (const file of files) {
    const relPath = relative('.', file).replace(/\\/g, '/');
    const content = readFileSync(file);
    const isBinary = /\.(jpg|jpeg|png|webp|ico|svg|woff|woff2|ttf|eot)$/i.test(file);

    const blob = await gh('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: content.toString(isBinary ? 'base64' : 'utf-8'),
        encoding: isBinary ? 'base64' : 'utf-8'
      })
    });

    treeItems.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });
  }

  // 4. Create new tree
  console.log('Creating Git Tree...');
  const tree = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: latestCommitSha,
      tree: treeItems
    })
  });

  // 5. Create new commit
  console.log(`Creating Commit: "${commitMsg}"...`);
  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: commitMsg,
      tree: tree.sha,
      parents: [latestCommitSha]
    })
  });

  // 6. Update branch ref
  console.log('Updating branch reference...');
  await gh(`/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: commit.sha,
      force: true
    })
  });

  console.log(`✅ SUCCESS! Pushed commit ${commit.sha.substring(0, 7)} to GitHub.`);
  console.log(`🌐 Vercel is now automatically deploying the changes to ali-sami.vercel.app!`);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});

