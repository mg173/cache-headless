const puppeteer = require('puppeteer-extra')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin())

const workerpool = require('workerpool');
const sleep = require('sleep-promise');
const Sitemapper = require('sitemapper');
const axios = require('axios');

const utils = require(__dirname + '/utils.js');

const DEBUG = false;
const TIME_BETWEEN_PAGES = DEBUG ? 500 : 500;
const NUM_WORKERS = 25;

const pool = workerpool.pool(__dirname + '/worker-warmer.js', {
  minWorkers: 'max',
  maxWorkers: NUM_WORKERS,
  workerType: 'process',
});

async function getSitemap() {
  const sitemap = new Sitemapper();
  const sitemapResult = await sitemap.fetch('https://getdispute.com/sitemap.xml');
  const sites = sitemapResult.sites;
  return sites;
}

async function warmSites(sites) {
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
    utils.elog('error warmSites', e);
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
  utils.log('start whole sitemap');

  const sites = await getSitemap()
  const shuffledSites = shuffle(sites);
  await warmSites(sites);

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  utils.log('finish whole sitemap', duration);
}

async function getLatestCommit() {
  const res = await axios.get('https://api.github.com/repos/getdispute/pineapple-web/commits/production?per_page=1', {
    auth: {
      username: 'mg173',
      password: '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',
    }
  });
  return res?.data?.sha;
}

async function main() {

  process.on('SIGINT', exitHandler.bind(null, {exit:true}));

  var lastCommitFound = null;
  do {
    const now = new Date().getHours();
    if (now >= 22 && now <= 10) {
      // between 10pm and 10am
      utils.log('sleeping night time');
      sleep(1000 * 60 * 100); 
    }
    const latestCommit = await getLatestCommit();
    if (latestCommit === lastCommitFound) {
      utils.log('sleeping no changes');
      await sleep(1000 * 60 * 10);
    }
    utils.log('found change, start warming');
    await warmSitemap();
    lastCommitFound = latestCommit;
  } while (!DEBUG)
}

async function exitHandler(options, exitCode) {
  await pool.terminate(true);
}

main()
