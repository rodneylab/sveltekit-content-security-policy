import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';

const __dirname = path.resolve();
const buildDir = path.join(__dirname, 'build');

const { SENTRY_ORG_ID, SENTRY_KEY, SENTRY_PROJECT_ID } = process.env;

function removeCspMeta(inputFile) {
  const fileContents = fs.readFileSync(inputFile, { encoding: 'utf-8' });
  const root = parse(fileContents);
  const element = root.querySelector('head meta[http-equiv="content-security-policy"]');
  const content = element.getAttribute('content');
  root.remove(element);
  return content;
}

const cspMap = new Map();

function findCspMeta(startPath, filter = /\.html$/) {
  if (!fs.existsSync(startPath)) {
    console.error(`Unable to find CSP start path: ${startPath}`);
    return;
  }
  const files = fs.readdirSync(startPath);
  files.forEach((item) => {
    const filename = path.join(startPath, item);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      findCspMeta(filename, filter);
    } else if (filter.test(filename)) {
      cspMap.set(filename.replace(buildDir, ''), removeCspMeta(filename));
    }
  });
}

function createHeaders() {
  const headers = `/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), document-domain=(), encrypted-media=(), gyroscope=(), interest-cohort=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Report-To: {"group": "csp-endpoint", "max_age": 10886400, "endpoints": [{"url": "https://o${SENTRY_KEY}.ingest.sentry.io/api/${SENTRY_ORG_ID}/security/?sentry_key=${SENTRY_PROJECT_ID}"}]}
/manifest.webmanifest
  Content-Type: application/manifest+json
/assets/*
  cache-control: max-age=31536000
  cache-control: immutable`;
  const cspArray = [];
  cspMap.forEach((csp, pagePath) =>
    cspArray.push(`${pagePath}\n  Content-Security-Policy: ${csp}`),
  );

  const headersFile = path.join(buildDir, '_headers');
  fs.writeFileSync(headersFile, `${headers}${cspArray.join('\n')}`);
}

async function main() {
  findCspMeta(buildDir);
  createHeaders();
}

main();
