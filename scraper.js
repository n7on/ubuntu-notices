
import { chromium } from 'playwright';
import excel from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const url = 'https://ubuntu.com/security/notices';
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

await page.goto(url);
const baseUrl = new URL(page.url()).origin;

await page.getByRole('button', {name: 'Accept all and visit site'}).click()


const workbook = new excel.Workbook();
const worksheet = workbook.addWorksheet('Ubuntu');

worksheet.columns = [
    {key: 'link', header: 'Link', width: 50},
    {key: 'date', header: 'Date', width: 20}

]

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

notices.sort((a1, a2) => a1.date - a2.date ).forEach((n) => {
    worksheet.addRow({
        link: {text: n.name, hyperlink: `${baseUrl}${n.href}`},
        date: n.date.toISOString().split('T')[0]
    })
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exportPath = path.resolve(__dirname, 'notices.xlsx');

await workbook.xlsx.writeFile(exportPath);

await browser.close();