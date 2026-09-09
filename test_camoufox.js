import { Camoufox } from 'camoufox-js';

async function test() {
    console.log("Launching camoufox...");
    try {
        const browser = await Camoufox({ headless: true });
        const page = await browser.newPage();
        console.log("Going to rogmovies...");
        await page.goto('https://new2.rogmovies.click/ts-search.php?q=the');
        const content = await page.content();
        console.log("Content length:", content.length);
        console.log("Content (first 200 chars):", content.substring(0, 200));
        await browser.close();
    } catch(e) {
        console.error(e);
    }
}
test();
