const axios = require('axios');
async function test() {
  const sites = ['vegamovies', 'rogmovies', 'xprime'];
  for (const site of sites) {
    try {
      const res1 = await axios.get(`https://vglist.top/?re=${site}`, { maxRedirects: 0, validateStatus: () => true });
      let url = res1.headers.location;
      console.log(`${site} step 1:`, url);
      
      const res2 = await axios.get(url, { validateStatus: () => true });
      const match = res2.data.match(/url=(https?:\/\/[^"]+)/i);
      if (match) {
        console.log(`${site} final:`, match[1]);
      } else {
        console.log(`${site} no match in body`);
      }
    } catch (e) {
      console.log(e.message);
    }
  }
}
test();
