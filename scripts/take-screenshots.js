const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORTFOLIO_DIR = path.join(__dirname, '..', 'public', 'portfolio');

if (!fs.existsSync(PORTFOLIO_DIR)) {
  fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
}

// Token read from environment variables or auth-service session
const TOKEN = process.env.VOCALIQ_ACCESS_TOKEN || '';
const REFRESH_TOKEN = process.env.VOCALIQ_REFRESH_TOKEN || '';
const WORKSPACE_ID = process.env.VOCALIQ_WORKSPACE_ID || 'baee7afb-7d72-4d89-8581-5b40470ea8b0';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,900',
      '--hide-scrollbars',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ],
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  const page = await browser.newPage();

  // Helper to hide Next.js dev toast/error overlays and scrollbars
  async function cleanPage() {
    await page.addStyleTag({
      content: `
        [data-nextjs-toast], 
        nextjs-portal, 
        #nextjs__container_errors_desc,
        [data-nextjs-dialog-overlay] { 
          display: none !important; 
          visibility: hidden !important; 
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
      `
    });
  }

  async function waitForLoaded(timeout = 15000) {
    try {
      await page.waitForFunction(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        return spinners.length === 0;
      }, { timeout });
    } catch {
      // ignore timeout
    }
    await new Promise(r => setTimeout(r, 1200));
  }

  // 1. Landing Page
  console.log('Capturing 01-landing-page.png...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await cleanPage();
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '01-landing-page.png'),
    fullPage: false
  });

  // Set tokens in localStorage for authenticated pages
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.evaluate(({ token, refreshToken, wsId }) => {
    localStorage.setItem('vocaliq_access_token', token);
    localStorage.setItem('vocaliq_refresh_token', refreshToken);
    localStorage.setItem('vocaliq_active_ws', wsId);
  }, { token: TOKEN, refreshToken: REFRESH_TOKEN, wsId: WORKSPACE_ID });

  // 2. Dashboard Overview
  console.log('Capturing 02-dashboard.png...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await waitForLoaded();
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '02-dashboard.png'),
    fullPage: false
  });

  // 3. Agent Studio
  console.log('Capturing 03-agent-studio.png...');
  await page.goto('http://localhost:3000/dashboard/agent', { waitUntil: 'networkidle2' });
  await waitForLoaded();
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '03-agent-studio.png'),
    fullPage: false
  });

  // 4. Knowledge Base
  console.log('Capturing 04-knowledge-base.png...');
  await page.goto('http://localhost:3000/dashboard/knowledge-bases', { waitUntil: 'networkidle2' });
  await waitForLoaded();
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '04-knowledge-base.png'),
    fullPage: false
  });

  // 5. Knowledge Graph
  console.log('Capturing 05-knowledge-graph.png...');
  await page.goto('http://localhost:3000/dashboard/knowledge-bases/8276c737-2e3c-45b6-8f3e-fffc6d4242ab', { waitUntil: 'networkidle2' });
  await waitForLoaded();
  const graphTab = await page.$('button[id*="-trigger-graph"]');
  if (graphTab) {
    console.log('Clicking Knowledge Graph tab...');
    await graphTab.click();
    await waitForLoaded();
    await new Promise(r => setTimeout(r, 3000));
  }
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '05-knowledge-graph.png'),
    fullPage: false
  });

  // 6. Live Voice Call Screen
  console.log('Capturing 06-live-voice-call.png...');
  await page.goto('http://localhost:3000/dashboard/test-calls', { waitUntil: 'networkidle2' });
  try {
    await page.waitForSelector('button[aria-label="Target Agent"]', { timeout: 15000 });
  } catch {}
  await waitForLoaded();
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '06-live-voice-call.png'),
    fullPage: false
  });

  // 7. Conversation History
  console.log('Capturing 07-conversation-history.png...');
  await page.goto('http://localhost:3000/dashboard/conversations', { waitUntil: 'networkidle2' });
  try {
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
  } catch {}
  await waitForLoaded();
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '07-conversation-history.png'),
    fullPage: false
  });

  // 8. Webhook Tools
  console.log('Capturing 08-webhook-tools.png...');
  await page.goto('http://localhost:3000/dashboard/settings', { waitUntil: 'networkidle2' });
  await waitForLoaded();
  const webhookTab = await page.$('button[id*="-trigger-webhooks"]');
  if (webhookTab) {
    console.log('Clicking Webhooks tab...');
    await webhookTab.click();
    await waitForLoaded();
    await new Promise(r => setTimeout(r, 2000));
  }
  await cleanPage();
  await page.screenshot({
    path: path.join(PORTFOLIO_DIR, '08-webhook-tools.png'),
    fullPage: false
  });

  await browser.close();
  console.log('All 8 screenshots successfully captured!');
}

main().catch(err => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
