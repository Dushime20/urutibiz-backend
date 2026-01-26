const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400'; // Sample car image

console.log('🔍 AI SEARCH FUNCTIONALITY TEST\n');
console.log('='.repeat(80));
console.log(`Testing against: ${BASE_URL}`);
console.log('='.repeat(80));
console.log('');

// Helper function to format results
function formatResults(title, data) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ${title}`);
    console.log(`${'='.repeat(80)}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
}

// Helper function to check response structure
function validateResponse(response, expectedFields) {
    const { data } = response;

    if (!data.success) {
        throw new Error(`Response not successful: ${data.message || 'Unknown error'}`);
    }

    for (const field of expectedFields) {
        if (!(field in data.data)) {
            throw new Error(`Missing expected field: ${field}`);
        }
    }

    return true;
}

// Test 1: Natural Language AI Search
async function testNaturalLanguageSearch() {
    console.log('\n📝 TEST 1: Natural Language AI Search');
    console.log('-'.repeat(80));

    const testQueries = [
        'camera in kigali which is at least 30000 rwf cost',
        'cheap red car',
        'new laptop under 50000',
        'used phone in good condition'
    ];

    for (const query of testQueries) {
        try {
            console.log(`\nQuery: "${query}"`);

            const response = await axios.get(`${BASE_URL}/products/ai-search`, {
                params: { prompt: query }
            });

            validateResponse(response, ['data', 'page', 'limit', 'total', 'aiInterpretation']);

            const { data: responseData } = response.data;
            console.log(`✅ Success!`);
            console.log(`   - Results found: ${responseData.total}`);
            console.log(`   - AI Interpretation:`, responseData.aiInterpretation);
            console.log(`   - Derived Filters:`, JSON.stringify(responseData.aiInterpretation.derivedFilters, null, 2));

            if (responseData.data && responseData.data.length > 0) {
                console.log(`   - Sample result: ${responseData.data[0].title}`);
            }
        } catch (error) {
            console.error(`❌ Failed for query "${query}":`, error.response?.data || error.message);
        }
    }
}

// Test 2: Image-Based Search (URL)
async function testImageSearchByURL() {
    console.log('\n🖼️  TEST 2: Image-Based Search (URL)');
    console.log('-'.repeat(80));

    try {
        console.log(`\nSearching with image URL: ${TEST_IMAGE_URL}`);

        const response = await axios.post(`${BASE_URL}/products/search-by-image`, {
            image_url: TEST_IMAGE_URL
        }, {
            params: {
                threshold: 0.3,
                limit: 10
            }
        });

        validateResponse(response, ['items', 'pagination', 'search_metadata']);

        const { data: responseData } = response.data;
        console.log(`✅ Success!`);
        console.log(`   - Results found: ${responseData.items.length}`);
        console.log(`   - Processing time: ${responseData.search_metadata.processing_time_ms}ms`);
        console.log(`   - Cache hit: ${responseData.search_metadata.cache_hit}`);
        console.log(`   - Match distribution:`, responseData.search_metadata.match_distribution);

        if (responseData.items && responseData.items.length > 0) {
            console.log(`\n   Top 3 Results:`);
            responseData.items.slice(0, 3).forEach((item, idx) => {
                console.log(`   ${idx + 1}. ${item.product.title}`);
                console.log(`      - Similarity: ${(item.similarity_percentage).toFixed(2)}%`);
                console.log(`      - Match type: ${item.match_type}`);
                console.log(`      - Price: ${item.product.base_price_per_day} ${item.product.currency}/day`);
            });
        }
    } catch (error) {
        console.error(`❌ Failed:`, error.response?.data || error.message);
    }
}

// Test 3: Image-Based Search (File Upload)
async function testImageSearchByFile() {
    console.log('\n📤 TEST 3: Image-Based Search (File Upload)');
    console.log('-'.repeat(80));

    try {
        // Download test image first
        console.log(`\nDownloading test image...`);
        const imageResponse = await axios.get(TEST_IMAGE_URL, {
            responseType: 'arraybuffer'
        });

        const tempImagePath = path.join(__dirname, 'temp-test-image.jpg');
        fs.writeFileSync(tempImagePath, imageResponse.data);
        console.log(`✅ Image downloaded to ${tempImagePath}`);

        // Create form data
        const form = new FormData();
        form.append('image', fs.createReadStream(tempImagePath));

        console.log(`\nUploading image for search...`);
        const response = await axios.post(
            `${BASE_URL}/products/search-by-image?threshold=0.3&limit=10`,
            form,
            {
                headers: form.getHeaders()
            }
        );

        // Clean up temp file
        fs.unlinkSync(tempImagePath);

        validateResponse(response, ['items', 'pagination', 'search_metadata']);

        const { data: responseData } = response.data;
        console.log(`✅ Success!`);
        console.log(`   - Results found: ${responseData.items.length}`);
        console.log(`   - Processing time: ${responseData.search_metadata.processing_time_ms}ms`);
        console.log(`   - Query features dimension: ${responseData.search_metadata.query_features_dimension}`);

        if (responseData.items && responseData.items.length > 0) {
            console.log(`\n   Top result:`);
            const topResult = responseData.items[0];
            console.log(`   - Product: ${topResult.product.title}`);
            console.log(`   - Similarity: ${topResult.similarity_percentage.toFixed(2)}%`);
            console.log(`   - Match type: ${topResult.match_type}`);
        }
    } catch (error) {
        console.error(`❌ Failed:`, error.response?.data || error.message);
    }
}

// Test 4: Regular Product Search
async function testRegularSearch() {
    console.log('\n🔎 TEST 4: Regular Product Search');
    console.log('-'.repeat(80));

    const testCases = [
        { search: 'camera', description: 'Text search' },
        { search: 'laptop', min_price: 10000, max_price: 50000, description: 'Search with price range' },
        { category: 'electronics', description: 'Category filter' }
    ];

    for (const testCase of testCases) {
        try {
            const { description, ...params } = testCase;
            console.log(`\nTest: ${description}`);
            console.log(`   Params:`, params);

            const response = await axios.get(`${BASE_URL}/products/search`, {
                params
            });

            validateResponse(response, ['data', 'page', 'limit', 'total']);

            const { data: responseData } = response.data;
            console.log(`✅ Success!`);
            console.log(`   - Results found: ${responseData.total}`);
            console.log(`   - Page: ${responseData.page}/${responseData.totalPages}`);

            if (responseData.data && responseData.data.length > 0) {
                console.log(`   - First result: ${responseData.data[0].title}`);
            }
        } catch (error) {
            console.error(`❌ Failed for ${testCase.description}:`, error.response?.data || error.message);
        }
    }
}

// Test 5: Error Handling
async function testErrorHandling() {
    console.log('\n⚠️  TEST 5: Error Handling');
    console.log('-'.repeat(80));

    const errorTests = [
        {
            name: 'AI Search without prompt',
            test: () => axios.get(`${BASE_URL}/products/ai-search`),
            expectedError: 'Prompt is required'
        },
        {
            name: 'Image Search without image',
            test: () => axios.post(`${BASE_URL}/products/search-by-image`, {}),
            expectedError: 'Please provide an image file or image_url'
        }
    ];

    for (const errorTest of errorTests) {
        try {
            console.log(`\nTest: ${errorTest.name}`);
            await errorTest.test();
            console.log(`❌ Should have thrown an error but didn't`);
        } catch (error) {
            if (error.response && error.response.data) {
                const errorMessage = error.response.data.message || error.response.data.error;
                if (errorMessage && errorMessage.includes(errorTest.expectedError)) {
                    console.log(`✅ Correctly handled error: "${errorMessage}"`);
                } else {
                    console.log(`⚠️  Got error but message doesn't match expected`);
                    console.log(`   Expected: "${errorTest.expectedError}"`);
                    console.log(`   Got: "${errorMessage}"`);
                }
            } else {
                console.log(`❌ Unexpected error:`, error.message);
            }
        }
    }
}

// Run all tests
async function runAllTests() {
    try {
        console.log('\n🚀 Starting AI Search Tests...\n');

        await testNaturalLanguageSearch();
        await testImageSearchByURL();
        await testImageSearchByFile();
        await testRegularSearch();
        await testErrorHandling();

        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL TESTS COMPLETED');
        console.log('='.repeat(80));
        console.log('\nPlease review the results above to verify:');
        console.log('1. ✅ Natural language queries are correctly parsed');
        console.log('2. ✅ Image search returns similar products');
        console.log('3. ✅ Regular search works with filters');
        console.log('4. ✅ Error handling is working properly');
        console.log('');
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
