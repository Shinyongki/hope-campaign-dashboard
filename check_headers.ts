import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const csvUrl = envConfig.NEXT_PUBLIC_SHEET_CSV_URL;

console.log('Fetching from:', csvUrl);

if (!csvUrl) {
    console.error('No CSV URL found');
    process.exit(1);
}

fetch(csvUrl)
    .then(res => res.text())
    .then(text => {
        const firstLine = text.split('\n')[0];
        console.log('Header line:', firstLine);
        const headers = firstLine.split(',');
        headers.forEach((h, i) => console.log(`${i}: ${h}`));
    })
    .catch(err => console.error(err));
