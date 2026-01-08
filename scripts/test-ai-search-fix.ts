import AISearchService from '../src/services/aiSearch.service';

async function testFix() {
    console.log('Testing AISearchService.parseNaturalLanguageQuery...');
    
    const queries = [
        'looking for a new laptop',
        'used camera under 500',
        'phone like new',
        'fair condition bike'
    ];

    for (const query of queries) {
        console.log(`\nQuery: "${query}"`);
        try {
            const result = await AISearchService.parseNaturalLanguageQuery(query);
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error parsing query:', error);
        }
    }
}

testFix().catch(console.error);
