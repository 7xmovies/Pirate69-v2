import axios from 'axios';
async function test() {
    try {
        const url = 'https://new2.rogmovies.click/page/1/?s=batman';
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        console.log(`Status: ${res.status}`);
        const html = res.data;
        const matches = html.match(/href="(https:\/\/new2\.rogmovies\.click\/download-[^"]+)"/g);
        console.log(`Body hits: ${matches ? matches.length : 0}`);
        if(matches) console.log(matches.slice(0,3));
    } catch(e) {
        console.error(e);
    }
}
test();
