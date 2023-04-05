const fs = require('fs');
const path = require('path');

function extractItemInfo(item) {
    const request = item.request;

    const headerKey = request.header.length > 0 ? `Header Key: ${request.header[0].key}` : '';
    const method = `Method: ${request.method}`;

    let bodyKeys = '';
    if(request.body && request.body.mode === 'raw') {
        const body = JSON.parse(request.body.raw);
        const keys = Object.keys(body);
        if(keys.length > 0) {
            bodyKeys = `Accepted Fields: ${keys.join(', ')}`;
        }     
    }

    const urlPath = request.url ? request.url.path.join('/') : '';
    const pathStr = `Path: ${urlPath}\n`;

    return [
        `Name: ${item.name}`,
        method,
        headerKey,
        bodyKeys,
        pathStr,
        ''
    ].filter(Boolean);
}

async function processFile(filepath) {
    console.log(`Processing file: ${filepath}`);
    try {
        const data = await fs.promises.readFile(filepath);
        const items = JSON.parse(data.toString()).item;
        const output = items.flatMap(extractItemInfo);
        const outputStream = fs.createWriteStream(path.join(path.dirname(filepath), `${path.parse(filepath).name}.txt`));
        outputStream.write(output.join('\n'));
        outputStream.end();
    } catch (error) {
        console.error(`Error processing file: ${filepath} ${error}`);
    }
}

async function processDirectory(dir) {
    console.log(`Processing directory: ${dir}`);
    try {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
            const filepath = path.join(dir, file);
            const stat = await fs.promises.stat(filepath);
            if (stat.isDirectory()) {
                await processDirectory(filepath);
            } else if (path.extname(filepath) === '.json') {
                await processFile(filepath);
            } else {
                console.log(`Skipping file: ${filepath}`);
            }
        }
    } catch (error) {
        console.error(`Error processing directory: ${dir} ${error}`);
    }
}

const rootDir = process.argv[2];
processDirectory(rootDir);
