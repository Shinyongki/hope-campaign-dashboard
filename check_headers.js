const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcT0nfo2wGlL1km3LpE61GcLCRO9-R6LaZz4KP36LijP_l2nrRiuwcQtr1hdM9NFNPfvx-UDWYLsBG/pub?output=csv';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const lines = data.split('\n');
        if (lines.length > 0) {
            const headers = lines[0].split(',');
            headers.forEach((h, i) => console.log(`${i}: ${h}`));
        }
    });

}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
