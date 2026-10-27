/**
 * Local verification for the dependency-free SMTP client in server/mailer.js.
 * Spins up a fake SMTP server, sends an OTP email through it, and asserts the
 * message body arrived. Run: node scripts/test-mailer-smtp.mjs
 */
import net from 'node:net';
import { sendDonorOtpEmail } from '../server/mailer.js';

const received = [];
let authSeen = false;

const server = net.createServer((socket) => {
  socket.setEncoding('utf8');
  let buffer = '';
  let inData = false;
  socket.write('220 fake.local ESMTP\r\n');
  socket.on('data', (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (inData) {
        if (line === '.') {
          inData = false;
          socket.write('250 2.0.0 Ok: queued\r\n');
        } else {
          received.push(line);
        }
        continue;
      }
      const upper = line.toUpperCase();
      if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
        socket.write('250-fake.local\r\n250 AUTH PLAIN LOGIN\r\n');
      } else if (upper.startsWith('AUTH PLAIN')) {
        authSeen = true;
        socket.write('235 2.7.0 Authentication successful\r\n');
      } else if (upper.startsWith('MAIL FROM')) {
        socket.write('250 2.1.0 Ok\r\n');
      } else if (upper.startsWith('RCPT TO')) {
        socket.write('250 2.1.5 Ok\r\n');
      } else if (upper === 'DATA') {
        inData = true;
        socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
      } else if (upper === 'QUIT') {
        socket.write('221 2.0.0 Bye\r\n');
        socket.end();
      } else {
        socket.write('250 2.0.0 Ok\r\n');
      }
    }
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

process.env.SMTP_URL = `smtp://smtp-user:smtp-pass@127.0.0.1:${port}`;
process.env.SMTP_FROM = 'HAND-Philippines <no-reply@hand-philippines.org>';

const result = await sendDonorOtpEmail({ identifier: 'donor@example.com', code: '654321' });
const body = received.join('\n');

const checks = [
  ['sendDonorOtpEmail reports SMTP delivery', result.delivered === true && result.transport === 'smtp'],
  ['AUTH PLAIN was used', authSeen === true],
  ['recipient header present', /^To: donor@example\.com$/m.test(body)],
  ['subject header present', /^Subject: Your HAND-Philippines sign-in code$/m.test(body)],
  ['OTP code present in body', body.includes('654321')],
];

server.close();
let failures = 0;
for (const [name, ok] of checks) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(failures === 0 ? '\nMAILER SMTP CHECK PASSED' : `\n${failures} MAILER CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
