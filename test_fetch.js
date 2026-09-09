async function run() {
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('https://new2.rogmovies.click/ts-search.php?q=batman', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://new2.rogmovies.click/',
                'Origin': 'https://new2.rogmovies.click',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
            }
        });
        console.log(res.status);
        console.log((await res.text()).slice(0, 100));
    } catch(e) { console.error(e) }
}
run();
