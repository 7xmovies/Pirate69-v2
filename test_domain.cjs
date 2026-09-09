const axios = require('axios');
async function fetchActualDomain(site) {
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
    } catch (e) {
        console.error(`Failed to resolve ${site}:`, e.message);
        return null;
    }
}
async function run() {
  console.log('vegamovies:', await fetchActualDomain('vegamovies'));
  console.log('rogmovies:', await fetchActualDomain('rogmovies'));
  console.log('xprime:', await fetchActualDomain('xprime'));
}
run();
