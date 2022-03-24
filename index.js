const puppeteer = require('puppeteer-extra')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin())

const workerpool = require('workerpool');
const sleep = require('sleep-promise');
const Sitemapper = require('sitemapper');

const DEBUG = false;
const TIME_BETWEEN_PAGES = DEBUG ? 500 : 2000;

async function getSitemap() {
  const sitemap = new Sitemapper();
  const sitemapResult = await sitemap.fetch('https://getdispute.com/sitemap.xml');
  const sites = sitemapResult.sites;
  return sites;
}

async function warmSites(sites) {
  const pool = workerpool.pool(__dirname + '/worker-warmer.js', {
    minWorkers: 'max',
    maxWorkers: 7,
  });
  try {
    const allRequests = [];
    for (var i = 0; i < (DEBUG ? 3 : sites.length); i++) {
      // submit 1 new job to the pool at a time
      const site = sites[i];
      const request = pool.exec('warmPage', [site]);
      allRequests.push(request);
      await sleep(TIME_BETWEEN_PAGES); 
    }
    await Promise.all(allRequests); // wait as long as needed for all requests
  } catch (e) {
    console.error(`${(new Date).toISOString()} error [${e}]`);
  } finally {
    await pool.terminate(true);
  }
}

function pprint(blob) {
  console.log(JSON.stringify(blob, null, 4));
}

function shuffle(array) {
  const shuffled = array.sort((a, b) => 0.5 - Math.random());
  return shuffled;
}

async function warmSitemap() {
  const startTime = new Date();
  console.log(`[${(new Date).toISOString()}] start whole sitemap`);

  const sites = await getSitemap()
  const shuffledSites = shuffle(sites);
  await warmSites(sites);

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  console.log(`[${(new Date).toISOString()}] whole sitemap complete. duration [${duration}]`);
}

async function main() {
  do {
    const now = new Date().getHours();
    if (now >= 22 && now <= 10) {
      // between 10pm and 10am
      console.log(`[${(new Date).toISOString()}] sleeping`);
      sleep(1000 * 60 * 10); // 10 minutes
    } else {
      await warmSitemap();
    }
  } while (!DEBUG)
}

main()
