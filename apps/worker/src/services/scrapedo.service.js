const axios = require('axios');
const logger = require('../config/logger');

const SCRAPEDO_BASE_URL = process.env.SCRAPEDO_BASE_URL || 'https://api.scrape.do';
const SCRAPEDO_API_KEY = process.env.SCRAPEDO_API_KEY;

/**
 * Build Google Search URL
 */
function buildGoogleSearchUrl(keyword, location, device) {
  const params = new URLSearchParams({
    q: keyword,
    num: '100',
    gl: location || 'us',
    hl: 'en',
    ...(device === 'mobile' ? { mobile: '1' } : {}),
  });
  return `https://www.google.com/search?${params.toString()}`;
}

/**
 * Scrape a URL via Scrape.do
 */
async function scrapeUrl(targetUrl, options = {}) {
  if (!SCRAPEDO_API_KEY) {
    throw new Error('SCRAPEDO_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    token: SCRAPEDO_API_KEY,
    url: targetUrl,
    render: options.render ? 'true' : 'false',
    ...(options.country ? { geoCode: options.country } : {}),
  });

  const scrapeUrl = `${SCRAPEDO_BASE_URL}/?${params.toString()}`;

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug({ targetUrl, attempt }, 'Scraping URL');

      const response = await axios.get(scrapeUrl, {
        timeout: 60000,
        headers: {
          Accept: 'text/html',
        },
      });

      if (response.status !== 200) {
        throw new Error(`Scrape.do returned status ${response.status}`);
      }

      return response.data;
    } catch (err) {
      lastError = err;
      logger.warn(
        { targetUrl, attempt, maxRetries, error: err.message },
        'Scrape attempt failed'
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to scrape URL after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Scrape Google search results
 */
async function scrapeGoogleSearch(keyword, location, device) {
  const googleUrl = buildGoogleSearchUrl(keyword, location, device);
  logger.info({ keyword, location, device, googleUrl }, 'Scraping Google search');

  const html = await scrapeUrl(googleUrl, {
    country: location || 'us',
  });

  return html;
}

/**
 * Scrape a website's homepage for SEO analysis
 */
async function scrapeDomainHomepage(domain) {
  const url = `https://${domain}`;
  logger.info({ domain }, 'Scraping domain homepage');

  try {
    const html = await scrapeUrl(url, { render: false });
    return html;
  } catch (err) {
    logger.warn({ domain, error: err.message }, 'Failed to scrape domain homepage');
    return null;
  }
}

module.exports = { scrapeGoogleSearch, scrapeDomainHomepage, buildGoogleSearchUrl };
