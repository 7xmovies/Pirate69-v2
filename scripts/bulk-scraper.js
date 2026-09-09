import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

/**
 * ============================================================================
 * BULK SCRAPER CONFIGURATION
 * ============================================================================
 * 
 * IMPORTANT: Because VegaMovies uses Cloudflare, standard 'axios' will often get 
 * a 403 Forbidden error. To run this scraper successfully, you should either:
 * 
 * Option A: Run FlareSolverr (https://github.com/FlareSolverr/FlareSolverr) locally 
 *           and route these axios requests through it.
 * Option B: Rewrite the axios parts of this script to use Puppeteer with the 
 *           puppeteer-extra-plugin-stealth plugin.
 * ============================================================================
 */

const args = process.argv.slice(2);
const sourceArg = args[0] || 'vegamovies';

let CATEGORY = 'hollywood';
let BASE_URL = 'https://new2.vegamovies.futbol';

if (sourceArg === 'rogmovies') {
    CATEGORY = 'bollywood';
    BASE_URL = 'https://rogmovies.cfd';
} else if (sourceArg === 'xprimehub') {
    CATEGORY = 'xprimehub';
    BASE_URL = 'https://xprimehub.pics';
}

const START_PAGE = parseInt(args[1]) || 1;
const END_PAGE = parseInt(args[2]) || 5;

// How many movies should be in a single chunk file?
const MOVIES_PER_CHUNK = 100;

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const INDEX_FILE = path.join(DATA_DIR, `${CATEGORY}-index.json`);
const CHUNK_DIR = path.join(DATA_DIR, CATEGORY);

// Ensure directories exist
if (!fs.existsSync(CHUNK_DIR)) fs.mkdirSync(CHUNK_DIR, { recursive: true });

// Helper to delay between requests (avoids rate limits)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a clean ID from a URL
function generateIdFromUrl(url) {
    const parts = url.split('/').filter(Boolean);
    let slug = parts[parts.length - 1];
    return slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

/**
 * Reads the current index file.
 */
function readIndex() {
    if (fs.existsSync(INDEX_FILE)) {
        return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    }
    return [];
}

/**
 * Saves the index file.
 */
function saveIndex(data) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
}

/**
 * Figures out which chunk file to write to.
 */
function getTargetChunkFile(indexData) {
    let maxChunkId = 1;
    let countInMaxChunk = 0;

    indexData.forEach(item => {
        if (item.chunk > maxChunkId) {
            maxChunkId = item.chunk;
        }
    });

    // Count how many movies are in the current max chunk
    countInMaxChunk = indexData.filter(item => item.chunk === maxChunkId).length;

    // If it's full, move to the next chunk
    if (countInMaxChunk >= MOVIES_PER_CHUNK) {
        maxChunkId++;
    }

    return maxChunkId;
}

/**
 * Saves a single movie to its chunk file.
 */
function saveMovieToChunk(chunkId, id, detailData) {
    const chunkFile = path.join(CHUNK_DIR, `chunk-${chunkId}.json`);
    let chunkData = {};

    if (fs.existsSync(chunkFile)) {
        chunkData = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
    }

    chunkData[id] = detailData;
    fs.writeFileSync(chunkFile, JSON.stringify(chunkData, null, 2));
}

/**
 * Scrape a specific movie page to get download links
 */
async function scrapeMoviePage(url) {
    console.log(`    -> Scraping details from: ${url}`);
    
    // NOTE: If Cloudflare blocks this, you must use Puppeteer or FlareSolverr here!
    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(response.data);
    const downloadLinks = [];

    // --- YOUR CUSTOM SELECTOR LOGIC GOES HERE ---
    // Example: Find all buttons that say "V-Cloud"
    $('a[href*="vcloud"], a.elementor-button, a.xp-download-btn').each((i, el) => {
        const linkText = $(el).text().trim();
        const linkUrl = $(el).attr('href');
        
        if (linkUrl && linkUrl.includes('http')) {
            downloadLinks.push({
                label: linkText || "Download Link",
                url: linkUrl
            });
        }
    });

    return {
        fullTitle: $('h1').text().trim(),
        downloadLinks: downloadLinks
    };
}

/**
 * Main Crawler Loop
 */
async function runScraper() {
    console.log(`🚀 Starting Bulk Scraper for ${CATEGORY}`);
    
    let indexData = readIndex();
    const existingIds = new Set(indexData.map(m => m.id));

    for (let page = START_PAGE; page <= END_PAGE; page++) {
        const pageUrl = page === 1 ? BASE_URL : `${BASE_URL}/page/${page}/`;
        console.log(`\n📄 Scraping Page ${page}: ${pageUrl}`);

        try {
            // NOTE: If Cloudflare blocks this, you must use Puppeteer or FlareSolverr here!
            const response = await axios.get(pageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            
            const $ = cheerio.load(response.data);
            const movieArticles = $('article, .post-item'); // Adjust selector based on site

            const moviesOnPage = [];

            movieArticles.each((i, el) => {
                const titleElement = $(el).find('h2 a, h3 a');
                const title = titleElement.text().trim();
                const link = titleElement.attr('href');
                const poster = $(el).find('img').attr('src');

                if (title && link) {
                    moviesOnPage.push({ title, link, poster });
                }
            });

            console.log(`Found ${moviesOnPage.length} movies on page ${page}.`);

            for (const movie of moviesOnPage) {
                const id = generateIdFromUrl(movie.link);

                if (existingIds.has(id)) {
                    console.log(`  [SKIP] ${movie.title} is already in the index.`);
                    continue; // Skip if already scraped
                }

                console.log(`  [NEW] Found ${movie.title}`);
                
                try {
                    // Random delay between 1 and 3 seconds to avoid getting banned
                    await delay(Math.floor(Math.random() * 2000) + 1000);
                    
                    // Scrape the inner page
                    const details = await scrapeMoviePage(movie.link);
                    
                    // Determine which chunk file this goes into
                    const targetChunk = getTargetChunkFile(indexData);

                    // 1. Add to Index
                    const indexEntry = {
                        id,
                        title: movie.title,
                        poster: movie.poster,
                        chunk: targetChunk
                    };
                    
                    // 2. Save Detail to Chunk
                    saveMovieToChunk(targetChunk, id, {
                        id,
                        fullTitle: details.fullTitle,
                        cleanTitle: movie.title,
                        poster: movie.poster,
                        sourceUrl: movie.link,
                        downloadLinks: details.downloadLinks
                    });

                    // 3. Update Index File
                    indexData.push(indexEntry);
                    saveIndex(indexData);
                    existingIds.add(id);

                    console.log(`  [SUCCESS] Saved ${id} into chunk-${targetChunk}.json`);
                } catch (err) {
                    console.error(`  [ERROR] Failed to scrape details for ${movie.title}: ${err.message}`);
                }
            }
            
            // Delay before next page
            await delay(3000);
            
        } catch (error) {
            console.error(`❌ Error scraping page ${page}:`, error.message);
            console.log("If this says 403 Forbidden, Cloudflare blocked you! You must use FlareSolverr or Puppeteer Stealth.");
            break; // Stop if Cloudflare blocks us
        }
    }
    
    console.log(`\n✅ Scraping Complete!`);
}

runScraper();
