const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

async function testQuery(prompt) {
    console.log(`\nTesting Prompt: "${prompt}"`);
    try {
        const response = await axios.get(`${BASE_URL}/products/ai-search`, {
            params: { prompt }
        });

        if (response.data && response.data.data && response.data.data.aiInterpretation) {
            const interpretation = response.data.data.aiInterpretation;
            console.log("Derived Filters:", JSON.stringify(interpretation.derivedFilters, null, 2));
        } else {
            console.log("No AI interpretation found in response.");
            console.log("Full Response Data:", JSON.stringify(response.data, null, 2));
        }

    } catch (error) {
        console.error("Error occurred:");
        if (error.response) {
            console.error(`- Status: ${error.response.status}`);
            console.error(`- Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error("- No response received (Network Error)");
            console.error(`- Error Message: ${error.message}`);
        } else {
            console.error(`- Message: ${error.message}`);
        }
    }
}

async function run() {
    console.log("Running NLP Debug Tests...");
    await testQuery("camera in kigali which is at least 30000 rwf cost");
    await testQuery("cheap red car");
    await testQuery("new laptop under 50000");
    await testQuery("used phone in good condition");
    await testQuery("I want a house in Kiyovu");
}

run();
