const puppeteer = require('puppeteer-extra')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin())

const workerpool = require('workerpool');
const sleep = require('sleep-promise');
const Sitemapper = require('sitemapper');

async function newBrowser() {
  const browser = await puppeteer.launch();
  return browser;
}

async function newPage() {
  const browser = await newBrowser();
  const page = await browser.newPage();
  page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes('a.getdispute.com')) {
      request.abort();
    }
  });
  return page;
}

async function cleanup(page) {
  try {
    await page.browser().close()
  } catch (e) {
    console.error(`error cleanup [${page}] [${e}]`);
  }
}

function getds() {
  return (new Date()).toISOString();
}

function logResponseHeaders(response) {
  const headers = response.headers();
  console.log(headers);
  const log = `[${getds()}] response header x-vercel-cache [${headers['x-vercel-cache']}]`;
  console.log(log);
}

async function warmPage(pageUrl) {
  const startTime = new Date();
  console.log(`[${getds()}] start page [${pageUrl}]`);
  const page = await newPage();
  try {
    const response = await page.goto(pageUrl);
    logResponseHeaders(response);
    await page.waitForNetworkIdle();
  } catch (e) {
    console.error(`[${getds()}] error page.goto [${pageUrl}] [${e}]`);
  }
  await cleanup(page);
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  console.log(`[${getds()}] complete page [${pageUrl}] in [${duration}]`);
}

workerpool.worker({
  warmPage: warmPage
});
