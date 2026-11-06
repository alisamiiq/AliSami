/**
 * Telegram bot helper (run locally, never deployed).
 *   node scripts/telegram-setup.mjs info      -> bot name + recent senders (to find your user ID)
 *   node scripts/telegram-setup.mjs webhook   -> register https://ali-sami.vercel.app/api/telegram
 *   node scripts/telegram-setup.mjs status    -> current webhook status
 * Reads TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET from .env.local.
 */
import { readFileSync, existsSync } from 'node:fs';

const env = {};
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
}
const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || env.TELEGRAM_WEBHOOK_SECRET;
const siteUrl = env.SITE_URL || 'https://ali-sami.vercel.app';
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN missing in .env.local');
  process.exit(1);
}

const tg = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
};

const cmd = process.argv[2] || 'info';

if (cmd === 'info') {
  const me = await tg('getMe');
  if (!me.ok) {
    console.log('Token check failed:', me.description);
    process.exit(1);
  }
  console.log(`Bot OK: @${me.result.username} (${me.result.first_name})`);
  const up = await tg('getUpdates', { limit: 50 });
  if (!up.ok) {
    console.log('getUpdates:', up.description);
  } else {
    const senders = new Map();
    for (const u of up.result) {
      const from = (u.message || u.edited_message || u.callback_query)?.from;
      if (from) senders.set(from.id, `${from.first_name || ''} ${from.last_name || ''} @${from.username || '-'}`.trim());
    }
    if (!senders.size) console.log('No messages yet. Send /start to the bot, then run this again.');
    for (const [id, name] of senders) console.log(`Sender: ${id}  ${name}`);
  }
} else if (cmd === 'webhook') {
  if (!secret) {
    console.error('TELEGRAM_WEBHOOK_SECRET missing in .env.local');
    process.exit(1);
  }
  const r = await tg('setWebhook', {
    url: `${siteUrl}/api/telegram`,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
  console.log('setWebhook:', r.ok ? 'OK' : r.description);
  const cmds = await tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'طريقة النشر' },
      { command: 'posts', description: 'آخر المنشورات (مع زر حذف)' },
    ],
  });
  console.log('setMyCommands:', cmds.ok ? 'OK' : cmds.description);
} else if (cmd === 'status') {
  const r = await tg('getWebhookInfo');
  console.log(JSON.stringify(r.result, null, 2));
}

