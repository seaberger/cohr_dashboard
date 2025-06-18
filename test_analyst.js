// Test script for analyst.js function
const handler = require('./api/analyst.js').default;

// Mock request and response objects
const req = {
    method: 'GET',
    query: {
        symbol: 'COHR',
        currentPrice: '81.07'
    }
};

const res = {
    setHeader: () => {},
    status: (code) => ({
        json: (data) => {
            console.log('Status:', code);
            console.log('Response:', JSON.stringify(data, null, 2));
        },
        end: () => {}
    })
};

// Test the function
handler(req, res).catch(console.error);