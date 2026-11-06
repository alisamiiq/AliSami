/**
 * Telegram → Website & Blog Command Center (Vercel Serverless Function).
 *
 * Features:
 *  - Publish articles with title, body, cover image, and automatic #tags extraction.
 *  - Interactive Control Panel (/panel):
 *      • Pin / Unpin posts (📌) to feature them first.
 *      • Hide / Show posts (👁️ draft mode) without deleting.
 *      • Edit existing posts (✏️) by replying with updated text/photo.
 *      • Delete posts (🗑) along with their cover image.
 *      • Website Sections Toggle (🧩): show or hide any section of the website live.
 *      • Live Blog & Site Statistics (📊 /stats).
 */

const POSTS_PATH = 'public/blog/posts.json';
const SITE_CONFIG_PATH = 'public/blog/site-config.json';
const IMAGES_DIR = 'public/blog/images';

const SECTIONS = [
  { id: 'about', label: 'نبذة عني' },
  { id: 'services', label: 'الخدمات' },
  { id: 'work', label: 'الأعمال والمشاريع' },
  { id: 'studies', label: 'الدراسة والتقنيات' },
  { id: 'internet', label: 'خدمات الإنترنت' },
  { id: 'blog', label: 'بوابة المدونة بالرئيسية' },
  { id: 'contact', label: 'قسم التواصل' },
];

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

const editMsg = (chatId, messageId, text, extra = {}) =>
  tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function downloadTelegramFile(fileId) {
  const info = await tg('getFile', { file_id: fileId });
  if (!info.ok) throw new Error('تعذّر جلب الصورة من تيليجرام');
  const res = await fetch(`https://api.telegram.org/file/bot${cfg().botToken}/${info.result.file_path}`);
  if (!res.ok) throw new Error('تعذّر تنزيل الصورة');
  const ext = (info.result.file_path.split('.').pop() || 'jpg').toLowerCase();
  return { base64: Buffer.from(await res.arrayBuffer()).toString('base64'), ext };
}

/* ───────────── GitHub helpers ───────────── */
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

async function readSiteConfig() {
  const { branch } = cfg();
  const file = await gh(`/contents/${SITE_CONFIG_PATH}?ref=${branch}`, { allow404: true });
  if (!file) return { hiddenSections: [] };
  try {
    const data = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    return {
      hiddenSections: Array.isArray(data?.hiddenSections) ? data.hiddenSections : [],
      updatedAt: data?.updatedAt,
    };
  } catch {
    return { hiddenSections: [] };
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

/* ───────────── Post parsing & UI builders ───────────── */
function makeId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes(),
  )}${pad(d.getUTCSeconds())}`;
}

function parsePostText(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const title = (lines.shift() || '').trim();

  // Extract #hashtags anywhere in the text
  const rawBody = lines.join('\n').trim();
  const tagMatches = rawBody.match(/#([\p{L}\p{N}_]+)/gu) || [];
  const tags = Array.from(new Set(tagMatches.map((m) => m.slice(1).replace(/_/g, ' '))));

  // If the last line is purely hashtags, strip it from the displayed body
  const bodyLines = rawBody.split('\n');
  if (bodyLines.length > 0) {
    const lastLine = bodyLines[bodyLines.length - 1].trim();
    if (lastLine && /^(#[\p{L}\p{N}_]+\s*)+$/u.test(lastLine)) {
      bodyLines.pop();
    }
  }
  const body = bodyLines.join('\n').trim();

  return { title, body, tags };
}

function postControlKeyboard(post) {
  const { siteUrl } = cfg();
  return {
    inline_keyboard: [
      [
        {
          text: post.pinned ? '📌 إلغاء التثبيت' : '📌 تثبيت بالواجهة',
          callback_data: `pin:${post.id}`,
        },
        {
          text: post.hidden ? '👁️ إظهار بالموقع' : '🚫 إخفاء مؤقت',
          callback_data: `hide:${post.id}`,
        },
      ],
      [
        { text: '✏️ تعديل المقال', callback_data: `editprompt:${post.id}` },
        { text: '🗑 حذف نهائي', callback_data: `del:${post.id}` },
      ],
      [
        { text: '🔗 معاينة المقال بالموقع', url: `${siteUrl}/#post-${post.id}` },
        { text: '🎛 لوحة التحكم', callback_data: 'panel:home' },
      ],
    ],
  };
}

function formatPostSummary(post) {
  const { siteUrl } = cfg();
  const status = [];
  if (post.pinned) status.push('📌 مثبت في المقدمة');
  if (post.hidden) status.push('🚫 مخفي (مسودة)');
  else status.push('✅ منشور علنياً');
  if (post.cover) status.push('🖼 مع صورة غلاف');

  const tagsLine = post.tags?.length ? `\n🏷 <b>الوسوم:</b> ${post.tags.map((t) => `#${esc(t)}`).join(' · ')}` : '';
  const excerpt = post.body ? `\n\n<i>${esc(post.body.slice(0, 180))}${post.body.length > 180 ? '…' : ''}</i>` : '';

  return (
    `📄 <b>${esc(post.title)}</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `<b>الحالة:</b> ${status.join(' | ')}` +
    tagsLine +
    excerpt +
    `\n\n🔗 ${siteUrl}/#post-${post.id}`
  );
}

const HELP_TEXT = (id) => `<b>أهلاً علي 👋 مرحباً بك في مركز التحكم بموقعك ومدونتك.</b>

<b>✍️ طريقة النشر السريع في بوابة المدونة:</b>
• أرسل رسالة: <b>السطر الأول عنوان المقال</b>، وما بعده نص المقال.
• <b>إضافة وسوم/تصنيفات:</b> اكتب في نهاية المقال وسوماً مثل <code>#ذكاء_اصطناعي #شبكات</code> لتُصنّف تلقائياً.
• <b>إضافة صورة غلاف:</b> أرسل صورة مع المقال في التعليق (Caption)، أو أرسل الصورة أولاً ثم اضغط <b>رد (Reply)</b> عليها بالنص.

<b>🎛 أوامر التحكم السريع:</b>
/panel — لوحة التحكم الشاملة (المقالات + أقسام الموقع + الإحصائيات)
/posts — إدارة المنشورات (تثبيت 📌، إخفاء 👁️، تعديل ✏️، حذف 🗑)
/sections — إظهار أو إخفاء أقسام الموقع بضغطة زر
/stats — إحصائيات الموقع والمدونة

<code>Owner ID: ${id}</code>`;

async function buildPanelHome() {
  const { siteUrl } = cfg();
  const [posts, siteConfig] = await Promise.all([readPosts(), readSiteConfig()]);
  const visibleCount = posts.filter((p) => !p.hidden).length;
  const pinnedCount = posts.filter((p) => p.pinned).length;
  const hiddenSecCount = siteConfig.hiddenSections.length;

  const text =
    `🎛 <b>لوحة التحكم بالموقع والمدونة</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `📝 <b>المقالات المنشورة:</b> ${visibleCount} (المثبتة: ${pinnedCount} | المسودات: ${posts.length - visibleCount})\n` +
    `🧩 <b>أقسام الموقع المفعلة:</b> ${SECTIONS.length - hiddenSecCount} من ${SECTIONS.length}\n\n` +
    `اختر القسم الذي تود التحكم به:`;

  const reply_markup = {
    inline_keyboard: [
      [{ text: `📝 إدارة المنشورات (${posts.length})`, callback_data: 'panel:posts' }],
      [
        { text: '🧩 إظهار / إخفاء أقسام الموقع', callback_data: 'panel:sections' },
        { text: '📊 الإحصائيات', callback_data: 'panel:stats' },
      ],
      [
        { text: '🌐 فتح الموقع', url: siteUrl },
        { text: '📖 فتح بوابة المدونة', url: `${siteUrl}/#blog-hub` },
      ],
    ],
  };

  return { text, reply_markup };
}

async function buildPostsList() {
  const posts = await readPosts();
  if (!posts.length) {
    return {
      text: '📭 <b>لا توجد منشورات بعد.</b>\nأرسل أي رسالة (السطر الأول عنوان، يليه المحتوى) لنشر أول مقال!',
      reply_markup: {
        inline_keyboard: [[{ text: '🔙 رجوع للوحة التحكم', callback_data: 'panel:home' }]],
      },
    };
  }

  const latest = posts.slice(0, 10);
  const lines = latest.map((p, i) => {
    const badges = `${p.pinned ? '📌 ' : ''}${p.hidden ? '🚫 ' : '✅ '}`;
    return `${i + 1}. ${badges}<b>${esc(p.title)}</b>`;
  });

  const rows = latest.map((p, i) => [
    {
      text: `${p.pinned ? '📌 ' : ''}${p.hidden ? '🚫 ' : ''}${i + 1}. ${p.title.slice(0, 28)}`,
      callback_data: `post:${p.id}`,
    },
  ]);
  rows.push([{ text: '🔙 رجوع للوحة التحكم', callback_data: 'panel:home' }]);

  return {
    text:
      `📝 <b>إدارة المنشورات (أحدث ${latest.length} من ${posts.length}):</b>\n` +
      `اضغط على أي مقال لتثبيته، إخفائه، تعديله أو حذفه:\n\n` +
      lines.join('\n'),
    reply_markup: { inline_keyboard: rows },
  };
}

async function buildSectionsPanel() {
  const siteConfig = await readSiteConfig();
  const hidden = new Set(siteConfig.hiddenSections);

  const rows = SECTIONS.map((sec) => {
    const isVisible = !hidden.has(sec.id);
    return [
      {
        text: `${isVisible ? '✅ ظاهر' : '🚫 مخفي'} — ${sec.label}`,
        callback_data: `sec:${sec.id}`,
      },
    ];
  });
  rows.push([{ text: '🔙 رجوع للوحة التحكم', callback_data: 'panel:home' }]);

  return {
    text:
      `🧩 <b>التحكم بأقسام الموقع:</b>\n` +
      `اضغط على أي قسم لإظهاره أو إخفائه فوراً من الموقع وشريط التنقل:\n\n` +
      `• <b>✅ ظاهر:</b> معروض للزوار في الموقع.\n` +
      `• <b>🚫 مخفي:</b> مخفي من الصفحة الرئيسية.`,
    reply_markup: { inline_keyboard: rows },
  };
}

async function buildStatsPanel() {
  const [posts, siteConfig] = await Promise.all([readPosts(), readSiteConfig()]);
  const visible = posts.filter((p) => !p.hidden);
  const pinned = posts.filter((p) => p.pinned);
  const hidden = posts.filter((p) => p.hidden);
  const withCover = posts.filter((p) => p.cover);

  const allTags = new Set();
  let totalWords = 0;
  for (const p of posts) {
    (p.tags || []).forEach((t) => allTags.add(t));
    totalWords += `${p.title} ${p.body}`.trim().split(/\s+/).filter(Boolean).length;
  }

  const lastDate = posts[0]?.date ? new Date(posts[0].date).toLocaleString('ar-IQ') : 'لا يوجد بعد';

  const text =
    `📊 <b>إحصائيات الموقع وبوابة المدونة</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `📚 <b>إجمالي المقالات:</b> ${posts.length}\n` +
    `✅ <b>المنشورة علنياً:</b> ${visible.length}\n` +
    `📌 <b>المثبتة في الواجهة:</b> ${pinned.length}\n` +
    `🚫 <b>المخفية (مسودات):</b> ${hidden.length}\n` +
    `🖼 <b>مقالات بصورة غلاف:</b> ${withCover.length}\n` +
    `✍️ <b>إجمالي الكلمات المكتوبة:</b> ${totalWords} كلمة\n` +
    `🏷 <b>الوسوم المستخدمة (${allTags.size}):</b> ${
      allTags.size ? Array.from(allTags).map((t) => `#${esc(t)}`).join(' · ') : 'لا توجد وسوم بعد'
    }\n` +
    `🧩 <b>الأقسام الظاهرة بالموقع:</b> ${SECTIONS.length - siteConfig.hiddenSections.length}/${SECTIONS.length}\n` +
    `🕒 <b>آخر نشر:</b> ${lastDate}`;

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📝 إدارة المنشورات', callback_data: 'panel:posts' },
          { text: '🧩 أقسام الموقع', callback_data: 'panel:sections' },
        ],
        [{ text: '🔙 رجوع للوحة التحكم', callback_data: 'panel:home' }],
      ],
    },
  };
}

/* ───────────── Message & Callback Handlers ───────────── */
async function handleMessage(msg) {
  const { ownerId, siteUrl } = cfg();
  const chatId = msg.chat.id;
  const fromId = String(msg.from?.id || '');

  if (!ownerId) {
    return reply(chatId, `البوت لم يُربط بصاحبه بعد.\nرقم حسابك: <code>${fromId}</code>\nضعه في TELEGRAM_OWNER_ID على Vercel.`);
  }
  if (fromId !== ownerId) {
    return reply(chatId, 'هذا بوت خاص بإدارة موقع علي سامي 🌐\nلزيارة الموقع: ' + siteUrl);
  }

  const text = (msg.text || msg.caption || '').trim();

  if (/^\/(start|help)/.test(text)) {
    return reply(chatId, HELP_TEXT(fromId), {
      reply_markup: {
        inline_keyboard: [[{ text: '🎛 فتح لوحة التحكم الشاملة', callback_data: 'panel:home' }]],
      },
    });
  }

  if (/^\/panel/.test(text)) {
    const view = await buildPanelHome();
    return reply(chatId, view.text, { reply_markup: view.reply_markup });
  }

  if (/^\/posts/.test(text)) {
    const view = await buildPostsList();
    return reply(chatId, view.text, { reply_markup: view.reply_markup });
  }

  if (/^\/sections/.test(text)) {
    const view = await buildSectionsPanel();
    return reply(chatId, view.text, { reply_markup: view.reply_markup });
  }

  if (/^\/stats/.test(text)) {
    const view = await buildStatsPanel();
    return reply(chatId, view.text, { reply_markup: view.reply_markup });
  }

  // Check if replying to an edit prompt (#edit_<id>)
  const replySource = msg.reply_to_message?.text || msg.reply_to_message?.caption || '';
  const editMatch = replySource.match(/#edit_([\w-]+)/);
  if (editMatch && !text.startsWith('/')) {
    const editId = editMatch[1];
    const { title, body, tags } = parsePostText(text);
    if (!title) return reply(chatId, '⚠️ اكتب العنوان الجديد في السطر الأول ثم نص المقال.');

    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    const posts = await readPosts();
    const idx = posts.findIndex((p) => p.id === editId);
    if (idx === -1) return reply(chatId, '⚠️ لم يتم العثور على المقال المراد تعديله.');

    const files = [];
    let cover = posts[idx].cover;
    if (msg.photo?.length) {
      const best = msg.photo[msg.photo.length - 1];
      const img = await downloadTelegramFile(best.file_id);
      const imgPath = `${IMAGES_DIR}/${editId}-${Date.now().toString(36)}.${img.ext}`;
      files.push({ path: imgPath, base64: img.base64 });
      cover = `/${imgPath.replace(/^public\//, '')}`;
    }

    posts[idx] = {
      ...posts[idx],
      title,
      body,
      tags,
      ...(cover ? { cover } : {}),
      updatedAt: new Date().toISOString(),
    };

    files.push({ path: POSTS_PATH, content: JSON.stringify(posts, null, 2) + '\n' });
    await commitFiles(files, `Blog: edit ${title.slice(0, 50)}`);

    return reply(
      chatId,
      `✅ <b>تم تحديث المقال بنجاح!</b>\n\n` + formatPostSummary(posts[idx]),
      { reply_markup: postControlKeyboard(posts[idx]) },
    );
  }

  if (text.startsWith('/')) {
    return reply(chatId, 'أمر غير معروف. أرسل /panel لفتح لوحة التحكم أو /start لعرض التعليمات.');
  }

  // A photo alone (no caption) → wait for a reply with the article text.
  if (msg.photo && !text) {
    return reply(chatId, '📷 وصلت الصورة! اضغط <b>رد (Reply)</b> عليها واكتب المقال (السطر الأول العنوان، يليه المحتوى والوسوم).');
  }

  const { title, body, tags } = parsePostText(text);
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
  const post = {
    id,
    title,
    body,
    date: new Date().toISOString(),
    ...(tags.length ? { tags } : {}),
    ...(cover ? { cover } : {}),
  };
  posts.unshift(post);
  files.push({ path: POSTS_PATH, content: JSON.stringify(posts, null, 2) + '\n' });

  await commitFiles(files, `Blog: ${title.slice(0, 60)}`);

  return reply(
    chatId,
    `✅ <b>تم نشر المقال في بوابة المدونة!</b>\nسيظهر خلال دقيقة واحدة:\n\n` + formatPostSummary(post),
    { reply_markup: postControlKeyboard(post) },
  );
}

async function handleCallback(cb) {
  const { ownerId } = cfg();
  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;

  if (String(cb.from.id) !== ownerId) {
    return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'غير مسموح' });
  }

  const data = String(cb.data || '');
  const [action, param] = data.split(':');

  // 1. Panel navigation
  if (action === 'panel') {
    let view;
    if (param === 'posts') view = await buildPostsList();
    else if (param === 'sections') view = await buildSectionsPanel();
    else if (param === 'stats') view = await buildStatsPanel();
    else view = await buildPanelHome();

    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    if (chatId && messageId) {
      return editMsg(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    }
    return;
  }

  // 2. View single post control card
  if (action === 'post' && param) {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === param);
    if (!post) {
      return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المقال غير موجود' });
    }
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    const kb = postControlKeyboard(post);
    kb.inline_keyboard.push([{ text: '🔙 العودة لقائمة المنشورات', callback_data: 'panel:posts' }]);
    return editMsg(chatId, messageId, formatPostSummary(post), { reply_markup: kb });
  }

  // 3. Pin / Unpin post
  if (action === 'pin' && param) {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === param);
    if (!post) {
      return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المقال غير موجود' });
    }
    post.pinned = !post.pinned;
    await commitFiles(
      [{ path: POSTS_PATH, content: JSON.stringify(posts, null, 2) + '\n' }],
      `Blog: ${post.pinned ? 'pin' : 'unpin'} ${post.title.slice(0, 40)}`,
    );
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: post.pinned ? '📌 تم تثبيت المقال في الواجهة' : 'تم إلغاء التثبيت',
    });
    if (chatId && messageId) {
      return editMsg(chatId, messageId, formatPostSummary(post), { reply_markup: postControlKeyboard(post) });
    }
    return;
  }

  // 4. Hide / Show post (Draft mode)
  if (action === 'hide' && param) {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === param);
    if (!post) {
      return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المقال غير موجود' });
    }
    post.hidden = !post.hidden;
    await commitFiles(
      [{ path: POSTS_PATH, content: JSON.stringify(posts, null, 2) + '\n' }],
      `Blog: ${post.hidden ? 'hide' : 'show'} ${post.title.slice(0, 40)}`,
    );
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: post.hidden ? '🚫 تم إخفاء المقال من الموقع' : '👁️ تم إظهار المقال في الموقع',
    });
    if (chatId && messageId) {
      return editMsg(chatId, messageId, formatPostSummary(post), { reply_markup: postControlKeyboard(post) });
    }
    return;
  }

  // 5. Prompt to edit post
  if (action === 'editprompt' && param) {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === param);
    if (!post) {
      return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المقال غير موجود' });
    }
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'أرسل التعديل بالرد على الرسالة' });
    const tagsStr = post.tags?.length ? '\n' + post.tags.map((t) => `#${t.replace(/\s+/g, '_')}`).join(' ') : '';
    return reply(
      chatId,
      `✏️ <b>تعديل المقال</b> <code>#edit_${post.id}</code>\n` +
        `اضغط <b>رد (Reply)</b> على هذه الرسالة وأرسل النص الجديد (السطر الأول العنوان، يليه المحتوى):\n\n` +
        `<pre>${esc(post.title)}\n${esc(post.body)}${esc(tagsStr)}</pre>`,
    );
  }

  // 6. Delete post
  if (action === 'del' && param) {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === param);
    if (!post) {
      return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المنشور محذوف مسبقاً' });
    }

    const files = [{ path: POSTS_PATH, content: JSON.stringify(posts.filter((p) => p.id !== param), null, 2) + '\n' }];
    if (post.cover?.startsWith('/blog/images/')) files.push({ path: `public${post.cover}`, delete: true });

    await commitFiles(files, `Blog: delete ${post.title.slice(0, 50)}`);
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: '🗑 تم حذف المنشور' });
    if (chatId && messageId) {
      return editMsg(chatId, messageId, `🗑 <b>تم حذف المنشور:</b> ${esc(post.title)}\nسيختفي من الموقع خلال دقيقة.`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 إدارة المنشورات', callback_data: 'panel:posts' },
              { text: '🎛 لوحة التحكم', callback_data: 'panel:home' },
            ],
          ],
        },
      });
    }
    return;
  }

  // 7. Toggle website section visibility
  if (action === 'sec' && param) {
    const siteConfig = await readSiteConfig();
    const set = new Set(siteConfig.hiddenSections);
    const nowHidden = !set.has(param);
    if (nowHidden) set.add(param);
    else set.delete(param);

    const updated = {
      hiddenSections: Array.from(set),
      updatedAt: new Date().toISOString(),
    };
    await commitFiles(
      [{ path: SITE_CONFIG_PATH, content: JSON.stringify(updated, null, 2) + '\n' }],
      `Site config: ${nowHidden ? 'hide' : 'show'} section ${param}`,
    );

    const secLabel = SECTIONS.find((s) => s.id === param)?.label || param;
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: nowHidden ? `🚫 تم إخفاء قسم: ${secLabel}` : `✅ تم إظهار قسم: ${secLabel}`,
    });

    if (chatId && messageId) {
      const view = await buildSectionsPanel();
      return editMsg(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    }
    return;
  }

  return tg('answerCallbackQuery', { callback_query_id: cb.id });
}

/* ───────────── Entry point ───────────── */
export default async function handler(req, res) {
  const { botToken, secret, ghToken } = cfg();

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, service: 'aliwebsite-bot', configured: Boolean(botToken && secret && ghToken) });
  }

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
    if (chatId) await reply(chatId, `⚠️ حدث خطأ أثناء التنفيذ:\n<code>${esc(err.message || err)}</code>`);
  }

  return res.status(200).json({ ok: true });
}
