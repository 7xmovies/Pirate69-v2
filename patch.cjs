const fs = require('fs');

let content = fs.readFileSync('server/api.ts', 'utf8');

const replacement = `import { Router } from 'express';
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
        proxyList = response.data.split('\\n').map((p) => p.trim()).filter((p) => p);
        console.log(\`Loaded \${proxyList.length} proxies from ErcinDedeoglu/proxies\`);
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
        const res = await axios.get(url, { ...options, timeout: 8000 });
        return res;
    } catch (err) {
        const isCloudflareBlock = err.response && [403, 503, 522, 500].includes(err.response.status);
        const isNetworkError = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
        
        if (!isCloudflareBlock && !isNetworkError) {
            throw err; // Re-throw standard errors
        }
        console.log(\`Direct request blocked or failed (\${err.response?.status || err.code}). Trying proxies...\`);
    }

    // 2. Try Proxies if Direct Connection Blocked
    await refreshProxies();
    if (proxyList.length === 0) {
        throw new Error('All requests blocked and no proxies available.');
    }

    const attempts = 5;
    for (let i = 0; i < attempts; i++) {
        const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
        const agent = new HttpsProxyAgent(\`http://\${proxy}\`);
        try {
            console.log(\`Trying proxy \${proxy} for \${url}\`);
            const res = await axios.get(url, { ...options, httpsAgent: agent, timeout: 5000 });
            console.log(\`Proxy \${proxy} succeeded!\`);
            return res;
        } catch (err) {
            console.log(\`Proxy \${proxy} failed.\`);
        }
    }
    throw new Error('Failed to fetch data. Direct request blocked and proxy attempts failed.');
}

const router = Router();`;

content = content.replace(/import \{ Router \} from 'express';[\s\S]*?const router = Router\(\);/, replacement);

content = content.replace(
    /const response = await axios\.get\(searchUrl/g,
    'const response = await axiosGetWithFallback(searchUrl'
);

content = content.replace(
    /const response = await axios\.get\(url, \{\n\s*headers: \{\n\s*'User-Agent'/g,
    'const response = await axiosGetWithFallback(url, {\n      headers: {\n        \'User-Agent\''
);

fs.writeFileSync('server/api.ts', content, 'utf8');
console.log("Patched server/api.ts successfully!");
