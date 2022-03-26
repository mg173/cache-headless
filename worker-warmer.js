const puppeteer = require('puppeteer-extra')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin())

const workerpool = require('workerpool');
const sleep = require('sleep-promise');
const Sitemapper = require('sitemapper');
const utils = require(__dirname + '/utils.js');

async function newBrowser() {
  const browser = await puppeteer.launch();
  return browser;
}

async function newPage(browser) {
  const page = await browser.newPage();
  page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request._interceptionHandled) {
      return;
    }
    if (request.url().includes('a.getdispute.com')) {
      request.abort('failed', 0);
    } else {
      request.continue(request.continueRequestOverrides(), 0);
    }
  });
  return page;
}

function logResponseHeaders(pageUrl, response) {
  const headers = response.headers();
  utils.log('response header', pageUrl, 'x-vercel-cache', headers['x-vercel-cache']);
}

async function warmPage(pageUrl) {
  const startTime = new Date();
  utils.log('start page', pageUrl);
  const browser = await newBrowser();
  const page = await newPage(browser);
  try {
    const networkStartTime = new Date();
    const response = await page.goto(pageUrl);
    const networkEndTime = new Date();
    logResponseHeaders(pageUrl, response);
    utils.log('network first response time', (networkEndTime-networkStartTime)/100);
    await page.waitForNetworkIdle();
  } catch (e) {
    utils.elog('error page.goto', pageUrl, e);
  }   
  try {
    await page.close();
    await browser.close();
  } catch (e) {
    utils.elog('error cleanup', pageUrl, e);
  }
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  utils.log('complete page', pageUrl, duration);
}

workerpool.worker({
  warmPage: warmPage
});
