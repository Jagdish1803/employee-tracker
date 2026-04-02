const cheerio = require('cheerio');
const logger = require('../config/logger');

/**
 * Parse Google SERP HTML and extract organic results
 */
function parseGoogleResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  // Try multiple selectors for Google's result structure
  const resultSelectors = [
    'div.g',
    'div[data-hveid]',
    'div.tF2Cxc',
    'div[jscontroller]',
  ];

  let resultElements = null;

  for (const selector of resultSelectors) {
    const elements = $(selector);
    if (elements.length > 5) {
      resultElements = elements;
      break;
    }
  }

  if (!resultElements || resultElements.length === 0) {
    logger.warn('No result elements found in Google HTML');
    return results;
  }

  let position = 1;
  resultElements.each((i, el) => {
    if (position > 100) return false;

    try {
      const element = $(el);

      // Skip ads and non-organic results
      if (element.find('[data-text-ad]').length > 0) return;
      if (element.closest('#tads, #bottomads, .ads-fr').length > 0) return;

      // Extract URL
      const linkEl = element.find('a[href^="http"]').first();
      if (!linkEl.length) return;

      const url = linkEl.attr('href');
      if (!url || !url.startsWith('http')) return;

      // Extract domain
      let domain;
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return;
      }

      // Extract title
      const title =
        element.find('h3').first().text().trim() ||
        element.find('[role="heading"]').first().text().trim() ||
        linkEl.text().trim();

      if (!title) return;

      // Extract description
      const description =
        element.find('.VwiC3b, .s3v9rd, .st, [data-sncf], .lEBKkf').first().text().trim() ||
        element.find('span').filter((_, el) => $(el).text().length > 50).first().text().trim();

      results.push({
        position,
        domain,
        url,
        title: title.slice(0, 500),
        description: description.slice(0, 1000),
      });

      position++;
    } catch (err) {
      logger.debug({ error: err.message }, 'Error parsing result element');
    }
  });

  logger.info({ count: results.length }, 'Parsed SERP results');
  return results;
}

/**
 * Find position of target domain in results
 */
function findDomainPosition(results, targetDomain) {
  const normalizedTarget = targetDomain.replace(/^www\./, '').toLowerCase();

  for (const result of results) {
    const normalizedDomain = result.domain.replace(/^www\./, '').toLowerCase();
    if (normalizedDomain === normalizedTarget || normalizedDomain.endsWith(`.${normalizedTarget}`)) {
      return result.position;
    }
  }

  return null; // Not found in top 100
}

/**
 * Extract top N competitors (excluding target domain)
 */
function extractCompetitors(results, targetDomain, count = 10) {
  const normalizedTarget = targetDomain.replace(/^www\./, '').toLowerCase();

  return results
    .filter((r) => {
      const normalizedDomain = r.domain.replace(/^www\./, '').toLowerCase();
      return normalizedDomain !== normalizedTarget;
    })
    .slice(0, count)
    .map((r) => ({
      domain: r.domain,
      position: r.position,
      url: r.url,
      title: r.title,
    }));
}

/**
 * Parse SEO data from a domain's homepage HTML
 */
function parseDomainSeo(html, domain) {
  if (!html) return null;

  const $ = cheerio.load(html);

  const title = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const h1Tags = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2Tags = $('h2')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(Boolean).length;

  const images = $('img');
  const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;

  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  const hasViewport = $('meta[name="viewport"]').length > 0;

  const schemaMarkup = $('script[type="application/ld+json"]').length;

  return {
    title,
    metaDescription,
    h1Tags,
    h2Tags,
    wordCount,
    imagesTotal: images.length,
    imagesWithoutAlt,
    canonicalUrl,
    hasViewport,
    schemaMarkup,
    bodyTextLength: bodyText.length,
  };
}

module.exports = { parseGoogleResults, findDomainPosition, extractCompetitors, parseDomainSeo };
