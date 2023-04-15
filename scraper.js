
import { chromium } from 'playwright';
import fs from 'fs';

const url = 'https://ubuntu.com/security/notices';
const fileName = 'notices.csv';
let run = true
let notices = [];

if (process.argv.length != 3) {
    console.error('Usage: node scraper.js "<date>"');
    process.exit(1);
}

const to = new Date(process.argv[2]);

if(isNaN(to)){
    console.log('Not a date!')
    process.exit(2);
}

const browser = await chromium.launch({
    headless: true
});

const page = await browser.newPage();
const baseUrl = new URL(page.url()).origin;

await page.goto(url);

await page.getByRole('button', {name: 'Accept all and visit site'}).click()


while(run){

    for(const article of await page.getByRole('article').all()){
        const link = article.getByRole('link').first()
        const date = await article.locator('p.u-no-margin.u-no-padding--top').first().textContent();

        let notice = {
            date: new Date(date),
            name: await link.innerHTML(),
            href: await link.getAttribute('href')
        }

        if(notice.date < to) {run = false; break;}

        notices.push(notice);
    }

    const next = page.locator('.p-pagination__link--next');
    
    if(!next || !run) break;
    
    await next.click()
}

fs.writeFileSync(fileName, 'Link,Date\n');


notices.sort((a1, a2) => a1.date - a2.date ).forEach((n) => {
    let row = `<a href="${baseUrl}${n.href}">${n.name}</a>,${n.date.toISOString().split('T')[0]}\n`;
    fs.appendFileSync(fileName, row);
});

await browser.close();