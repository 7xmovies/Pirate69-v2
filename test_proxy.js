import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    try {
        const proxyRes = await axios.get('https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt');
        const proxies = proxyRes.data.split('\n').map(p => p.trim()).filter(p => p);
        console.log(`Found ${proxies.length} proxies.`);
        
        // Try to fetch rogmovies using a few proxies
        for (let i = 0; i < 5; i++) {
            const p = proxies[Math.floor(Math.random() * proxies.length)];
            console.log(`Trying proxy ${p}`);
            const agent = new HttpsProxyAgent(`http://${p}`);
            
            try {
                const start = Date.now();
                const res = await axios.get('https://new2.rogmovies.click/ts-search.php?q=the', {
                    httpsAgent: agent,
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                console.log(`Success with ${p} in ${Date.now() - start}ms! Status: ${res.status}`);
                break;
            } catch (err) {
                console.log(`Failed with ${p}: ${err.message}`);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
test();
