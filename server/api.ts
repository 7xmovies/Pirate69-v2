import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Proxy Management
let proxyList = [];
let proxyLastFetched = 0;

async function refreshProxies() {
    const now = Date.now();
    if (now - proxyLastFetched < 3600000 && proxyList.length > 0) return; // refresh every hour
    try {
        const response = await axios.get('https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt');
        proxyList = response.data.split('\n').map((p) => p.trim()).filter((p) => p);
        console.log(`Loaded ${proxyList.length} proxies from ErcinDedeoglu/proxies`);
        proxyLastFetched = now;
    } catch (error) {
        console.error('Failed to fetch proxy list', error);
    }
}
// Initialize proxies on startup
refreshProxies();

/**
 * Wrapper for axios.get that falls back to proxies if blocked by Cloudflare.
 */
async function axiosGetWithFallback(url, options = {}) {
    // 1. Try Direct Connection First (Fastest & most reliable)
    try {
        const res = await axios.get(url, { ...options, timeout: 15000 });
        return res;
    } catch (err) {
        const isCloudflareBlock = err.response && [403, 503, 522, 500].includes(err.response.status);
        const isNetworkError = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
        
        if (!isCloudflareBlock && !isNetworkError) {
            throw err; // Re-throw standard errors
        }
        console.log(`Direct request blocked or failed (${err.response?.status || err.code}). Trying proxies...`);
    }

    // 2. Try Proxies if Direct Connection Blocked
    await refreshProxies();
    if (proxyList.length === 0) {
        throw new Error('All requests blocked and no proxies available.');
    }

    const attempts = 5;
    for (let i = 0; i < attempts; i++) {
        const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
        const agent = new HttpsProxyAgent(`http://${proxy}`);
        try {
            console.log(`Trying proxy ${proxy} for ${url}`);
            const res = await axios.get(url, { ...options, httpsAgent: agent, timeout: 10000 });
            console.log(`Proxy ${proxy} succeeded!`);
            return res;
        } catch (err) {
            console.log(`Proxy ${proxy} failed.`);
        }
    }
    throw new Error('Failed to fetch data. Direct request blocked and proxy attempts failed.');
}

const router = Router();

let cachedVegaDomain = '';
let cachedRogDomain = '';
let cachedXprimeDomain = '';
let lastResolveTime = 0;

async function fetchActualDomain(site: string) {
    try {
        const res1 = await axios.get(`https://vglist.top/?re=${site}`, { maxRedirects: 0, validateStatus: () => true });
        let url = res1.headers.location;
        
        if (!url) {
            const match = res1.data.match(/url=(https?:\/\/[^"]+)/i);
            if (match) url = match[1];
        }

        if (!url) return null;
        
        if (url.includes('vglist')) {
            const res2 = await axios.get(url, { validateStatus: () => true });
            const match = res2.data.match(/url=(https?:\/\/[^"]+)/i);
            if (match) {
                url = match[1];
            } else {
                return null;
            }
        }
        
        if (url.endsWith('/')) url = url.slice(0, -1);

        // Special case for vegamovies which might return a landing page (e.g. 1vegamovies.sbs)
        if (site === 'vegamovies' && !url.includes('new')) {
            const step2Url = `${url}/?re=vg&t=2`;
            const step2Res = await axios.get(step2Url, { maxRedirects: 0, validateStatus: () => true });
            if (step2Res.headers.location) {
                url = step2Res.headers.location;
                if (url.endsWith('/')) url = url.slice(0, -1);
            } else {
                const data = step2Res.data || '';
                const domainMatch = data.match(/https:\/\/(new[0-9]*\.vegamovies\.[a-z]+)/i) || 
                                    data.match(/https:\/\/([a-z0-9-]+\.vegamovies\.[a-z]+)/i);
                if (domainMatch) {
                    url = 'https://' + domainMatch[1];
                }
            }
        }
        
        return url;
    } catch (e: any) {
        console.error(`Failed to resolve ${site}:`, e.message);
        return null;
    }
}

async function resolveDomains() {
  const now = Date.now();
  if (now - lastResolveTime < 1000 * 60 * 60) { // Cache for 1 hour 
     return;
  }
  
  const rog = await fetchActualDomain('rogmovies');
  if (rog) {
      cachedRogDomain = rog;
      console.log('Auto-resolved Rogmovies:', cachedRogDomain);
  }

  const xprime = await fetchActualDomain('xprime');
  if (xprime) {
      cachedXprimeDomain = xprime;
      console.log('Auto-resolved XprimeHub:', cachedXprimeDomain);
  }

  const vega = await fetchActualDomain('vegamovies');
  if (vega) {
      cachedVegaDomain = vega;
      console.log('Auto-resolved Vegamovies:', cachedVegaDomain);
  }
  
  lastResolveTime = now;
}

async function getVegaDomain() {
    await resolveDomains();
    return cachedVegaDomain || process.env.VEGAMOVIES_DOMAIN || 'https://new2.vegamovies.futbol';
}

async function getRogDomain() {
    await resolveDomains();
    return cachedRogDomain || process.env.ROGMOVIES_DOMAIN || 'https://new2.rogmovies.click';
}

async function getXprimeDomain() {
    await resolveDomains();
    return cachedXprimeDomain || process.env.XPRIME_DOMAIN || 'https://xprimehub.pics';
}

// API route for searching VegaMovies
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string || '*'; // '*' acts as fetch latest/all
    const category = req.query.category as string || '';
    const source = req.query.source as string || 'vegamovies';
    const page = parseInt(req.query.page as string) || 1;

    let baseUrl = await getVegaDomain();
    if (source === 'rogmovies') {
        baseUrl = await getRogDomain();
    } else if (source === 'xprimehub') {
        baseUrl = await getXprimeDomain();
    }

    const searchEndpoint = source === 'xprimehub' ? 'search.php' : 'ts-search.php';
    let searchUrl = `${baseUrl}/${searchEndpoint}?q=${encodeURIComponent(query)}&page=${page}`;
    if (category) {
      searchUrl += `&category=${encodeURIComponent(category)}`;
    }

    console.log(`Fetching from: ${searchUrl}`);
    
    const response = await axiosGetWithFallback(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': baseUrl + '/',
        'Origin': baseUrl,
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      }
    });
    
    const results: any[] = [];
    const data = response.data;
    let totalPages = 1;
    
    if (data && data.hits && Array.isArray(data.hits)) {
      data.hits.forEach((hit: any, i: number) => {
        const doc = hit.document;
        if (doc) {
          results.push({
            id: doc.id || i.toString(),
            title: doc.post_title,
            thumbnail: doc.post_thumbnail,
            link: doc.permalink ? `${baseUrl}${doc.permalink}` : '',
          });
        }
      });
      // typesense returns 'found' as total hits. Assuming 20 or 24 per page. Let's say 24 per page.
      if (data.found) {
        totalPages = Math.ceil(data.found / 24);
      }
    }

    res.json({ results, page, totalPages, hasMore: page < totalPages });
  } catch (error: any) {
    console.error('Scraping error:', error.message);
    res.status(500).json({ error: 'Failed to extract information. The site might be protected or unreachable.' });
  }
});

// API route for extracting post details
router.get('/details', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Fetching details from: ${url}`);
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const response = await axiosGetWithFallback(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': baseUrl + '/',
        'Origin': baseUrl,
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('h1').text().trim() || $('title').text().trim();
    const content = $('article').length ? $('article') : $('main').length ? $('main') : $('.entry-content').length ? $('.entry-content') : $('body');

    let thumbnail = '';
    const screenshots: string[] = [];

    content.find('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (!src) return;
      
      if (src.includes('avatar') || src.includes('logo') || src.includes('icon') || src.includes('svg')) return;
      
      if (!thumbnail) {
          thumbnail = src;
      } else {
          // Keep mostly actual images like imgbb or tmdb
          if (src.includes('imgbb') || src.includes('tmdb') || src.includes('imgur') || src.includes('vegamovies') || src.includes('rogmovies') || src.includes('xprime') || src.includes('postimg')) {
             if (!screenshots.includes(src)) {
                 screenshots.push(src);
             }
          }
      }
    });

    const downloadLinks: any[] = [];
    content.find('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        
        // Extract nexdrive or vcloud links
        const hasBtn = $(el).find('button').length > 0;
        const hasBtnClass = $(el).hasClass('btn') || $(el).hasClass('button') || $(el).hasClass('dwd-button') || $(el).hasClass('maxbutton');
        const textLower = text.toLowerCase();
        
        const isKnownLink = href && (href.includes('nexdrive') || href.includes('vcloud') || href.includes('api.shareus.in') || href.includes('fastdl'));
        const isVcloudText = textLower.includes('v-cloud');
        const isButtonLink = hasBtn || hasBtnClass || textLower.includes('download now') || textLower.includes('batch/zip') || textLower.includes('g-direct');
        
        if (href && (isKnownLink || isVcloudText || isButtonLink)) {
            let name = text || 'Download Link';
            if (isVcloudText) name = 'V-Cloud ' + name;
            let prev = $(el).parent().prev();
            while(prev.length > 0) {
                const hText = prev.text().trim();
                if (prev.is('h3') || prev.is('h4') || prev.is('h5') || prev.is('h6') || prev.is('p')) {
                    if (hText.length > 5 && hText.length < 150) {
                       // Combine header text (which usually has quality/episode info) with button text
                       name = `${hText} - ${name}`;
                       break;
                    }
                }
                prev = prev.prev();
            }
            
            if (!href.includes('vegamovies-apk')) {
               downloadLinks.push({ name, url: href });
            }
        }
    });

    res.json({
      details: {
        title,
        thumbnail,
        screenshots,
        downloadLinks
      }
    });
  } catch (error: any) {
    console.error('Details scraping error:', error.message);
    res.status(500).json({ error: 'Failed to extract details.' });
  }
});

// API route for proxying images to bypass hotlinking protections
router.get('/image', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).send('URL is required');
    }

    const vegaDomain = await getVegaDomain();
    const rogDomain = await getRogDomain();
    const xprimeDomain = await getXprimeDomain();
    
    let referer = vegaDomain.endsWith('/') ? vegaDomain : `${vegaDomain}/`;
    if (url.includes('rogmovies')) {
      referer = rogDomain.endsWith('/') ? rogDomain : `${rogDomain}/`;
    } else if (url.includes('xprime')) {
      referer = xprimeDomain.endsWith('/') ? xprimeDomain : `${xprimeDomain}/`;
    }

    const response = await axiosGetWithFallback(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    res.set('Content-Type', response.headers['content-type'] as string);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(response.data);
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    res.status(404).send('Image not found');
  }
});

// API route to resolve Nexdrive links
router.get('/resolve-link', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('nexdrive')) {
      return res.json({ resolvedUrl: url }); // Return original if not nexdrive
    }

    console.log(`Resolving Nexdrive link: ${url}`);
    const response = await axiosGetWithFallback(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const $ = cheerio.load(response.data);
    let resolvedUrl = url; // Default to original if we can't find a better one
    
    // Find all valid target links (Only V-Cloud)
    const validLinks: { name: string, url: string }[] = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().toLowerCase();
      if (href && (href.includes('vcloud') || text.includes('v-cloud')) && !href.includes('nexdrive')) {
        
        let epName = $(el).text().trim() || 'Link';
        let prev = $(el).parent().prev();
        while(prev.length > 0) {
            const hText = prev.text().trim();
            if (hText.includes('Episode') || hText.includes('Ep')) {
                epName = `${hText} - ${epName}`;
                break;
            }
            prev = prev.prev();
        }
        validLinks.push({ name: epName, url: href });
      }
    });

    if (validLinks.length === 1) {
      resolvedUrl = validLinks[0].url;
      res.json({ resolvedUrl });
    } else if (validLinks.length > 1) {
       res.json({ resolvedUrls: validLinks }); 
    } else {
       res.json({ resolvedUrl });
    }
  } catch (error: any) {
    console.error('Link resolver error:', error.message);
    res.status(500).json({ error: 'Failed to resolve link.', originalUrl: req.query.url });
  }
});

export default router;
