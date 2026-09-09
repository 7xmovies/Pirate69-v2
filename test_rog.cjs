const axios = require('axios');
async function run() {
  try {
      const res1 = await axios.get(`https://vglist.top/?re=rogmovies`, { maxRedirects: 0, validateStatus: () => true });
      console.log('step 1:', res1.headers.location);
      let url = res1.headers.location;
      if (!url && res1.data) {
          const m = res1.data.match(/url=(https?:\/\/[^"]+)/i);
          if(m) url = m[1];
      }
      console.log('url after step 1:', url);
      
      const res2 = await axios.get(url, { validateStatus: () => true });
      console.log('step 2 data snippet:', res2.data.slice(0, 500));
      let match = res2.data.match(/url=(https?:\/\/[^"]+)/i);
      console.log('url after step 2:', match ? match[1] : 'no match');
  } catch(e) { console.error(e) }
}
run();
