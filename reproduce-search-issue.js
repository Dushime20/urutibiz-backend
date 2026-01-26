
const axios = require('axios');

async function testSearch() {
    const searchTerm = '🔍 AI Search: "i want house for rent"';
    const url = `http://localhost:8081/api/v1/products?page=1&limit=100&status=active&sort=relevance&search=${encodeURIComponent(searchTerm)}&priceMin=0&priceMax=0`;

    try {
        console.log('Testing URL:', url);
        const response = await axios.get(url);
        console.log('Status Code:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testSearch();
