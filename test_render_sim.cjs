const axios = require('axios');
async function run() {
  try {
      const res = await axios.get(`https://pirate69-nk10.onrender.com/api/search?page=1&source=rogmovies`, { maxRedirects: 0, validateStatus: () => true });
      console.log(res.data);
  } catch(e) { console.error(e) }
}
run();
