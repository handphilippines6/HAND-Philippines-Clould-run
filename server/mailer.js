/**
 * Transactional mailer for the donor one-time codes (port of the Wix email
 * step in donor-auth.web.js + donor-otp-email.js).
 *
 * Delivery:
 *   - Production: set SMTP_URL (and optionally SMTP_FROM / SMTP_HELO) and the
 *     code is sent with a small dependency-free SMTP client (net/tls, STARTTLS
 *     on 587, implicit TLS on 465, AUTH PLAIN/LOGIN).
 *   - Development (no SMTP_URL, NODE_ENV !== production): the message is
 *     appended to server/outbox/<timestamp>-<to>.txt and the code is logged so
 *     operators can read it locally.
 *   - Production without SMTP_URL: nothing is delivered and the failure is
 *     logged loudly — the OTP code is never written to disk or logs there.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import tls from 'node:tls';
import { once } from 'node:events';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTBOX = join(HERE, 'outbox');

export const OTP_EMAIL_SUBJECT = 'Your HAND-Philippines sign-in code';

export function buildOtpEmail({ identifier, code, expiresInMinutes = 10 }) {
  return [
    `Hello,`,
    ``,
    `Your HAND-Philippines donor dashboard sign-in code is:`,
    ``,
    `    ${code}`,
    ``,
    `This code expires in ${expiresInMinutes} minutes and can be used once.`,
    `If you did not request it, you can ignore this email — no account changes were made.`,
    ``,
    `HAND-Philippines — Health Assistance and Network Development`,
    `Questions? info@hand-philippines.org or (207) 800-7270 (call, VM or text).`,
    ``,
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * SMTP (dependency-free): smtp://user:pass@host:587 (STARTTLS) or
 * smtps://user:pass@host:465 (implicit TLS).
 * ------------------------------------------------------------------ */
function readSmtpConfig() {
  const raw = String(process.env.SMTP_URL || '').trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    console.error('[mailer] SMTP_URL is not a valid URL; falling back to the console transport.');
    return null;
  }
  const secure = url.protocol === 'smtps:' || url.searchParams.get('secure') === 'true';
  const from = String(process.env.SMTP_FROM || `HAND-Philippines <no-reply@${url.hostname}>`).trim();
  const address = /<([^>]+)>/.exec(from);
  return {
    host: url.hostname,
    port: Number(url.port || (secure ? 465 : 587)),
    secure,
    user: decodeURIComponent(url.username || ''),
    pass: decodeURIComponent(url.password || ''),
    from,
    fromAddress: (address ? address[1] : from).trim(),
    helo: String(process.env.SMTP_HELO || 'hand-philippines.org'),
  };
}

function createSession(config) {
  let socket = null;
  let pending = null;
  let buffer = '';

  function attach(current) {
    buffer = '';
    current.setEncoding('utf8');
    current.on('data', (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (!pending) continue;
        pending.lines.push(line);
        if (/^\d{3} /.test(line)) {
          const currentPending = pending;
          pending = null;
          currentPending.resolve({ code: Number(line.slice(0, 3)), lines: currentPending.lines });
        }
      }
    });
  }

  const readResponse = () => new Promise((resolve) => {
    pending = { resolve, lines: [] };
  });

  async function connect() {
    await new Promise((resolve, reject) => {
      if (config.secure) {
        socket = tls.connect({ host: config.host, port: config.port, servername: config.host });
        socket.once('secureConnect', resolve);
      } else {
        socket = net.connect({ host: config.host, port: config.port });
        socket.once('connect', resolve);
      }
      socket.once('error', reject);
    });
    attach(socket);
  }

  async function upgrade() {
    socket.removeAllListeners('data');
    const secured = tls.connect({ socket, servername: config.host });
    await once(secured, 'secureConnect');
    socket = secured;
    attach(socket);
  }

  const send = (line) => socket.write(`${line}\r\n`);
  const expect = async (codes) => {
    const response = await readResponse();
    if (!codes.includes(response.code)) {
      throw new Error(`SMTP ${response.code}: ${response.lines.join(' | ')}`);
    }
    return response;
  };
  const close = () => {
    try {
      socket?.destroy();
    } catch {
      /* already closed */
    }
  };

  return { connect, upgrade, send, expect, close, get socket() { return socket; } };
}

async function sendViaSmtp({ to, subject, body, config }) {
  const session = createSession(config);
  const timer = setTimeout(() => session.close(), 15_000);
  try {
    await session.connect();
    await session.expect([220]);
    session.send(`EHLO ${config.helo}`);
    let ehlo = await session.expect([250]);

    if (!config.secure && /starttls/i.test(ehlo.lines.join('\n'))) {
      session.send('STARTTLS');
      await session.expect([220]);
      await session.upgrade();
      session.send(`EHLO ${config.helo}`);
      ehlo = await session.expect([250]);
    }

    if (config.user) {
      const caps = ehlo.lines.join('\n').toLowerCase();
      if (caps.includes('auth plain')) {
        session.send(`AUTH PLAIN ${Buffer.from(`\u0000${config.user}\u0000${config.pass}`).toString('base64')}`);
      } else {
        session.send('AUTH LOGIN');
        await session.expect([334]);
        session.send(Buffer.from(config.user).toString('base64'));
        await session.expect([334]);
        session.send(Buffer.from(config.pass).toString('base64'));
      }
      await session.expect([235]);
    }

    session.send(`MAIL FROM:<${config.fromAddress}>`);
    await session.expect([250]);
    session.send(`RCPT TO:<${to}>`);
    await session.expect([250, 251]);
    session.send('DATA');
    await session.expect([354]);

    const headers = [
      `From: ${config.from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
    ].join('\r\n');
    session.socket.write(`${headers}\r\n\r\n${body.replace(/\r?\n/g, '\r\n')}\r\n.\r\n`);
    await session.expect([250]);
    session.send('QUIT');
    return true;
  } finally {
    clearTimeout(timer);
    session.close();
  }
}

export async function sendDonorOtpEmail({ identifier, code, expiresInMinutes = 10 }) {
  const body = buildOtpEmail({ identifier, code, expiresInMinutes });
  const config = readSmtpConfig();

  if (config) {
    try {
      await sendViaSmtp({ to: identifier, subject: OTP_EMAIL_SUBJECT, body, config });
      console.log(`[mailer] OTP email delivered to ${identifier} via SMTP.`);
      return { delivered: true, transport: 'smtp' };
    } catch (error) {
      console.error('[mailer] SMTP delivery failed:', error?.message || error);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[mailer] SMTP_URL is not configured (or delivery failed) — the OTP email was NOT delivered.');
    return { delivered: false, transport: 'none' };
  }

  try {
    mkdirSync(OUTBOX, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(join(OUTBOX, `${stamp}-${identifier.replace(/[^a-z0-9.@_-]/gi, '_')}.txt`), body);
  } catch {
    /* outbox is best-effort */
  }
  console.log(`[mailer] (dev) OTP for ${identifier}: ${code} (expires in ${expiresInMinutes}m)`);
  return { delivered: true, transport: 'outbox' };
}

