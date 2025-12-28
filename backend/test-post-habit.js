// Quick test to see actual backend logs
const http = require('http');

const postData = JSON.stringify({
    title: 'test habit',
    color: '#60A5FA'
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/habits',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        // You'll need to replace this with a real token from your browser
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error(`Problem: ${e.message}`);
});

req.write(postData);
req.end();
