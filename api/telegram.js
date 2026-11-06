/**
 * Telegram → Website publishing bot (Vercel Serverless Function).
 *
 * How it works:
 *  - Telegram sends every message of @Aliwebsite_bot to POST /api/telegram (webhook).
 *  - Only the owner (TELEGRAM_OWNER_ID) can publish; everyone else is politely refused.
 *  - A post = first line is the title, the rest is the body. A photo (with caption, or replied-to)
 *    becomes the cover image.
 *  - The post is committed to GitHub (public/blog/posts.json + public/blog/images/*),
 *    which makes Vercel rebuild the site automatically (~1 minute).
 *
 * Required environment variables (Vercel → Project → Settings → Environment Variables):
 *  TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_OWNER_ID, GITHUB_TOKEN
 * Optional: GITHUB_REPO (default alisamiiq/AliSami), GITHUB_BRANCH (default main), SITE_URL
 */

const POSTS_PATH = 'public/blog/posts.json';
const IMAGES_DIR = 'public/blog/images';

const cfg = () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  secret: process.env.TELEGRAM_WEBHOOK_SECRET,
  ownerId: String(process.env.TELEGRAM_OWNER_ID || '').trim(),
  ghToken: process.env.GITHUB_TOKEN,
  repo: process.env.GITHUB_REPO || 'alisamiiq/AliSami',
  branch: process.env.GITHUB_BRANCH || 'main',
  siteUrl: (process.env.SITE_URL || 'https://ali-sami.vercel.app').replace(/\/$/, ''),
});

/* ───────────── Telegram helpers ───────────── */
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${cfg().botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

const reply = (chatId, text, extra = {}) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function downloadTelegramFile(fileId) {
  const info = await tg('getFile', { file_id: fileId });
  if (!info.ok) throw new Error('تعذّر جلب الصورة من تيليجرام');
  const res = await fetch(`https://api.telegram.org/file/bot${cfg().botToken}/${info.result.file_path}`);
  if (!res.ok) throw new Error('تعذّر تنزيل الصورة');
  const ext = (info.result.file_path.split('.').pop() || 'jpg').toLowerCase();
  return { base64: Buffer.from(await res.arrayBuffer()).toString('base64'), ext };
}

/* ───────────── GitHub helpers (single commit for many files) ───────────── */
async function gh(path, options = {}) {
  const { ghToken, repo } = cfg();
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options,
    headers: {
      Authorization: `token ${ghToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'aliwebsite-bot',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 404 && options.allow404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function readPosts() {
  const { branch } = cfg();
  const file = await gh(`/contents/${POSTS_PATH}?ref=${branch}`, { allow404: true });
  if (!file) return [];
  try {
    const data = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** files: [{ path, content (utf-8) } | { path, base64 } | { path, delete: true }] */
async function commitFiles(files, message) {
  const { branch } = cfg();
  const ref = await gh(`/git/ref/heads/${branch}`);
  const baseSha = ref.object.sha;
  const baseCommit = await gh(`/git/commits/${baseSha}`);

  const tree = [];
  for (const f of files) {
    if (f.delete) {
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const blob = await gh('/git/blobs', {
      method: 'POST',
      body: JSON.stringify(
        f.base64 ? { content: f.base64, encoding: 'base64' } : { content: f.content, encoding: 'utf-8' },
      ),
    });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
  });
  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseSha] }),
  });
  await gh(`/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
}

/* ───────────── Post building ───────────── */
function makeId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes(),
  )}${pad(d.getUTCSeconds())}`;
}

function splitTitleBody(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const title = (lines.shift() || '').trim();
  const body = lines.join('\n').trim();
  return { title, body };
}

const HELP = (id) => `<b>أهلاً علي 👋 بوت النشر على موقعك جاهز.</b>

<b>طريقة النشر:</b>
• أرسل رسالة: <b>السطر الأول عنوان المقال</b>، وما بعده نص المقال.
• لإضافة صورة غلاف: أرسل صورة واكتب المقال في التعليق (Caption).
• لمقال طويل مع صورة: أرسل الصورة أولاً، ثم اضغط <b>رد (Reply)</b> عليها واكتب المقال.

<b>الأوامر:</b>
/posts — آخر المنشورات مع زر حذف

يظهر المنشور على الموقع خلال دقيقة تقريباً.
<code>ID: ${id}</code>`;

/* ───────────── Handlers ───────────── */
async function handleMessage(msg) {
  const { ownerId, siteUrl } = cfg();
  const chatId = msg.chat.id;
  const fromId = String(msg.from?.id || '');

  if (!ownerId) {
    return reply(chatId, `البوت لم يُربط بصاحبه بعد.\nرقم حسابك: <code>${fromId}</code>\nضعه في TELEGRAM_OWNER_ID على Vercel.`);
  }
  if (fromId !== ownerId) {
    return reply(chatId, 'هذا بوت خاص بالنشر على موقع علي سامي 🌐\nلزيارة الموقع: ' + siteUrl);
  }

  const text = msg.text || msg.caption || '';

  if (/^\/start|^\/help/.test(text)) return reply(chatId, HELP(fromId));

  if (/^\/posts/.test(text)) {
    const posts = await readPosts();
    if (!posts.length) return reply(chatId, 'لا توجد منشورات بعد.');
    const latest = posts.slice(0, 10);
    return reply(
      chatId,
      '<b>آخر المنشورات:</b>\n' + latest.map((p, i) => `${i + 1}. ${esc(p.title)}`).join('\n'),
      {
        reply_markup: {
          inline_keyboard: latest.map((p, i) => [{ text: `🗑 حذف ${i + 1}`, callback_data: `del:${p.id}` }]),
        },
      },
    );
  }

  if (text.startsWith('/')) return reply(chatId, 'أمر غير معروف. أرسل /start لعرض طريقة النشر.');

  // A photo alone (no caption) → wait for a reply with the article text.
  if (msg.photo && !text.trim()) {
    return reply(chatId, '📷 وصلت الصورة. اضغط <b>رد (Reply)</b> عليها واكتب المقال (السطر الأول عنوان).');
  }

  const { title, body } = splitTitleBody(text);
  if (!title) return reply(chatId, 'اكتب عنواناً في السطر الأول ثم نص المقال.');

  // Cover: photo in this message, or the photo this message replies to.
  const photoSizes = msg.photo || msg.reply_to_message?.photo;
  const id = makeId();
  const files = [];
  let cover;

  await tg('sendChatAction', { chat_id: chatId, action: 'typing' });

  if (photoSizes?.length) {
    const best = photoSizes[photoSizes.length - 1];
    const img = await downloadTelegramFile(best.file_id);
    const imgPath = `${IMAGES_DIR}/${id}.${img.ext}`;
    files.push({ path: imgPath, base64: img.base64 });
    cover = `/blog/images/${id}.${img.ext}`;
  }

  const posts = await readPosts();
  const post = { id, title, body, date: new Date().toISOString(), ...(cover ? { cover } : {}) };
  posts.unshift(post);
  files.push({ path: POSTS_PATH, content: JSON.stringify(posts, null, 2) + '\n' });

  await commitFiles(files, `Blog: ${title.slice(0, 60)}`);

  return reply(
    chatId,
    `✅ <b>تم النشر:</b> ${esc(title)}\nسيظهر على الموقع خلال دقيقة تقريباً:\n${siteUrl}/#post-${id}`,
    { reply_markup: { inline_keyboard: [[{ text: '🗑 حذف هذا المنشور', callback_data: `del:${id}` }]] } },
  );
}

async function handleCallback(cb) {
  const { ownerId } = cfg();
  const chatId = cb.message?.chat.id;
  if (String(cb.from.id) !== ownerId) {
    return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'غير مسموح' });
  }

  const [action, id] = String(cb.data || '').split(':');
  if (action !== 'del' || !id) return tg('answerCallbackQuery', { callback_query_id: cb.id });

  const posts = await readPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المنشور محذوف مسبقاً' });
    return;
  }

  const files = [{ path: POSTS_PATH, content: JSON.stringify(posts.filter((p) => p.id !== id), null, 2) + '\n' }];
  if (post.cover?.startsWith('/blog/images/')) files.push({ path: `public${post.cover}`, delete: true });

  await commitFiles(files, `Blog: delete ${post.title.slice(0, 60)}`);
  await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'تم الحذف' });
  if (chatId) await reply(chatId, `🗑 تم حذف: ${esc(post.title)}\nسيختفي من الموقع خلال دقيقة.`);
}

/* ───────────── Entry point ───────────── */
export default async function handler(req, res) {
  const { botToken, secret, ghToken } = cfg();

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, service: 'aliwebsite-bot', configured: Boolean(botToken && secret && ghToken) });
  }

  // Only Telegram (which knows the secret) may call this endpoint.
  if (!secret || req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(401).json({ ok: false });
  }

  const update = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;

  try {
    if (update.message) await handleMessage(update.message);
    else if (update.callback_query) await handleCallback(update.callback_query);
  } catch (err) {
    console.error(err);
    if (chatId) await reply(chatId, `⚠️ حدث خطأ أثناء النشر:\n<code>${esc(err.message || err)}</code>`);
  }

  // Always 200 so Telegram doesn't retry (and double-publish).
  return res.status(200).json({ ok: true });
}

