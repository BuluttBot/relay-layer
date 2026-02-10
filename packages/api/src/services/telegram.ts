const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7475046663';

export async function sendTelegramCode(code: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn('[telegram] No bot token configured, code:', code);
    return true;
  }
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `🔐 Relay layeR Login Code: **${code}**\n\nExpires in 5 minutes.`,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[telegram] Failed to send code:', err);
    return false;
  }
}
