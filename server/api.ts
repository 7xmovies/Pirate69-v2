import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Wrapper for axios.get (Proxy removed)
 */
async function axiosGetWithFallback(url: string, options: any = {}) {
    try {
        const res = await axios.get(url, { ...options, timeout: 5000 });
        return res;
    } catch (err: any) {
        console.error(`Direct request failed (${err?.response?.status || err?.code}): ${url}`);
        
        // Fallback to FlareSolverr
        let flareUrl = process.env.FLARESOLVERR_URL;
        if (flareUrl && options.responseType !== 'arraybuffer') {
            if (!flareUrl.endsWith('/v1')) {
                flareUrl = flareUrl.replace(/\/$/, '') + '/v1';
            }
            console.log(`Attempting to bypass with FlareSolverr at ${flareUrl}...`);
            try {
                const payload = {
                    cmd: 'request.get',
                    url: url,
                    maxTimeout: 60000
                };
                const flareRes = await axios.post(flareUrl, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 65000
                });
                
                if (flareRes.data.status === 'ok' && flareRes.data.solution) {
                    // Mimic standard axios response structure
                    return {
                        data: flareRes.data.solution.response,
                        status: flareRes.data.solution.status,
                        headers: flareRes.data.solution.headers || {}
                    };
                } else {
                    throw new Error('FlareSolverr did not return an OK status');
                }
            } catch (flareErr: any) {
                console.error(`FlareSolverr failed:`, flareErr?.message);
                throw flareErr;
            }
        }
        
        throw err;
    }
}

const router = Router();

let cachedVegaDomain = '';
let cachedRogDomain = '';
let cachedXprimeDomain = '';
let lastResolveTime = 0;

async function fetchActualDomain(site: string) {
    try {
        const res1 = await axios.get(`https://vglist.top/?re=${site}`, { maxRedirects: 0, validateStatus: () => true, timeout: 2000 });
        let url = res1.headers.location;
        
        if (!url) {
            const match = res1.data.match(/url=(https?:\/\/[^"]+)/i);
            if (match) url = match[1];
        }

        if (!url) return null;
        
        if (url.includes('vglist')) {
            const res2 = await axios.get(url, { validateStatus: () => true, timeout: 2000 });
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
            const step2Res = await axios.get(step2Url, { maxRedirects: 0, validateStatus: () => true, timeout: 2000 });
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

import fs from 'fs';
import path from 'path';

// --- NEW STATIC JSON ROUTES ---

// In production, these should point to the raw GitHub URLs
const GITHUB_REPO_URL = 'https://raw.githubusercontent.com/7xmovies/database/main';
const USE_LOCAL_FILES = process.env.NODE_ENV !== 'production';

const getCategoryName = (source: string) => {
    if (source === 'rogmovies') return 'bollywood';
    if (source === 'xprimehub') return 'xprimehub';
    return 'hollywood';
};

router.get('/json/search', async (req, res) => {
    try {
        const query = (req.query.q as string || '').toLowerCase();
        const source = req.query.source as string || 'vegamovies';
        const categoryName = getCategoryName(source);
        let indexData: any[] = [];

        if (USE_LOCAL_FILES) {
            const indexFile = path.join(process.cwd(), 'data', `${categoryName}-index.json`);
            if (fs.existsSync(indexFile)) {
                indexData = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
            }
        } else {
            const response = await axios.get(`${GITHUB_REPO_URL}/data/${categoryName}-index.json`);
            indexData = response.data;
        }

        // Filter the results
        const results = indexData.filter(movie => {
            if (query === '' || query === '*') return true;
            return movie.title.toLowerCase().includes(query) || 
                   movie.id.toLowerCase().includes(query);
        });

        res.json({ results, total: results.length });
    } catch (error: any) {
        console.error('Error fetching search index:', error);
        res.status(500).json({ error: 'Failed to fetch search index' });
    }
});

router.get('/json/movie/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const source = req.query.source as string || 'vegamovies';
        const categoryName = getCategoryName(source);
        let movieData = null;

        // 1. First, we must find which chunk this movie belongs to by reading the index
        let indexData: any[] = [];
        if (USE_LOCAL_FILES) {
            const indexFile = path.join(process.cwd(), 'data', `${categoryName}-index.json`);
            if (fs.existsSync(indexFile)) {
                indexData = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
            }
        } else {
            const response = await axios.get(`${GITHUB_REPO_URL}/data/${categoryName}-index.json`);
            indexData = response.data;
        }

        const movieIndexEntry = indexData.find(m => m.id === id);
        
        if (!movieIndexEntry) {
            return res.status(404).json({ error: 'Movie not found in index' });
        }

        const chunkId = movieIndexEntry.chunk || 1; // Default to 1 if not set

        // 2. Now fetch the specific chunk file
        if (USE_LOCAL_FILES) {
            const chunkFile = path.join(process.cwd(), 'data', categoryName, `chunk-${chunkId}.json`);
            if (fs.existsSync(chunkFile)) {
                const chunkData = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
                movieData = chunkData[id]; // Extract just this movie from the chunk dictionary
            }
        } else {
            const response = await axios.get(`${GITHUB_REPO_URL}/data/${categoryName}/chunk-${chunkId}.json`);
            const chunkData = response.data;
            movieData = chunkData[id];
        }

        if (movieData) {
            res.json(movieData);
        } else {
            res.status(404).json({ error: 'Movie details not found in chunk' });
        }
    } catch (error: any) {
        console.error(`Error fetching movie ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// --- ORIGINAL SCRAPING ROUTES ---

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
    
    // Find all valid target links (V-Cloud, G-Direct, V-Drive, Filepress)
    const validLinks: { name: string, url: string }[] = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().toLowerCase();
      
      const isTarget = href && !href.includes('nexdrive') && (
        href.includes('vcloud') || text.includes('v-cloud') ||
        href.includes('fastdl') || text.includes('g-direct') ||
        href.includes('vegadrive') || text.includes('v-drive') ||
        href.includes('filebee') || text.includes('filepress')
      );

      if (isTarget) {
        
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
        
        // Clean up the name for single movie mirrors
        epName = epName.replace(/⚡/g, '').trim();
        
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

import { spawn } from 'child_process';

interface ScrapeJob {
  id: string;
  source: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'stopped';
  progress: number;
  logs: string[];
  process?: import('child_process').ChildProcess;
}

const scrapeJobs = new Map<string, ScrapeJob>();

router.post('/scrape/start', (req, res) => {
  const { source, startPage, endPage } = req.body;
  const jobId = Date.now().toString();
  
  const job: ScrapeJob = {
    id: jobId,
    source: source || 'vegamovies',
    status: 'running',
    progress: 0,
    logs: ['[INFO] Scrape job initialized...']
  };
  
  scrapeJobs.set(jobId, job);
  
  try {
    // Determine which script to run based on source if needed
    // Currently using the unified bulk-scraper.js
    const scriptPath = path.join(process.cwd(), 'scripts', 'bulk-scraper.js');
    
    // Pass args: <source> <startPage> <endPage>
    const args = [scriptPath, job.source];
    if (startPage) args.push(startPage.toString());
    if (endPage) args.push(endPage.toString());

    const child = spawn('node', args);
    job.process = child;
    
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
         const logLines = output.split('\n');
         logLines.forEach((line: string) => {
            job.logs.push(line);
            // Very naive progress estimation if script outputs page progress
            if (line.includes('Fetching page') || line.includes('Scraping Page')) {
                const match = line.match(/(?:page|Page) (\d+)/);
                if (match) {
                    const current = parseInt(match[1]);
                    const start = startPage || 1;
                    const end = endPage || start + 4;
                    const totalPages = end - start + 1;
                    const donePages = current - start + 1;
                    job.progress = Math.min(Math.round((donePages / totalPages) * 100), 99);
                }
            }
         });
         // Keep last 100 logs
         if (job.logs.length > 100) {
            job.logs = job.logs.slice(job.logs.length - 100);
         }
      }
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
          const logLines = output.split('\n');
          logLines.forEach((line: string) => {
             job.logs.push(`[ERROR] ${line}`);
          });
      }
    });
    
    child.on('close', (code) => {
      if (job.status === 'stopped') {
          job.logs.push('[INFO] Job stopped cleanly by user.');
      } else {
          job.status = code === 0 ? 'completed' : 'error';
          job.progress = 100;
          job.logs.push(code === 0 ? '[SUCCESS] Job finished successfully.' : `[ERROR] Job exited with code ${code}`);
      }
      delete job.process; // Clean up memory
    });
    
    res.json({ jobId, message: 'Scrape job started successfully' });
  } catch (error: any) {
    job.status = 'error';
    job.logs.push(`[ERROR] Failed to start process: ${error.message}`);
    res.status(500).json({ error: 'Failed to start job' });
  }
});

router.post('/scrape/stop/:id', (req, res) => {
  const jobId = req.params.id;
  const job = scrapeJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'running' || !job.process) {
    return res.status(400).json({ error: 'Job is not running' });
  }
  
  job.status = 'stopped';
  job.logs.push('[INFO] Sending stop signal (SIGINT) to scraper...');
  job.process.kill('SIGINT');
  
  res.json({ success: true, message: 'Stop signal sent' });
});

router.post('/scrape/sync', (req, res) => {
    try {
        const child = spawn('npm', ['run', 'sync-data']);
        const jobId = 'sync-' + Date.now();
        
        const job: ScrapeJob = {
            id: jobId,
            source: 'git-sync',
            status: 'running',
            progress: 50,
            logs: ['[INFO] Starting database sync to GitHub...']
        };
        scrapeJobs.set(jobId, job);
        
        child.stdout.on('data', data => {
            const lines = data.toString().split('\n');
            lines.forEach((l: string) => { if(l.trim()) job.logs.push(l.trim()) });
        });
        
        child.stderr.on('data', data => {
            const lines = data.toString().split('\n');
            lines.forEach((l: string) => { if(l.trim()) job.logs.push(l.trim()) });
        });
        
        child.on('close', (code) => {
            job.status = code === 0 ? 'completed' : 'error';
            job.progress = 100;
            job.logs.push(code === 0 ? '[SUCCESS] Database sync completed' : `[ERROR] Sync failed with code ${code}`);
        });
        
        res.json({ success: true, jobId });
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/scrape/status/:id', (req, res) => {
  const job = scrapeJobs.get(req.params.id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

export default router;
