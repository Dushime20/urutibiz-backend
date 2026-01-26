require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
    console.log('Testing Groq API directly...');

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('❌ GROQ_API_KEY not found in environment variables');
        return;
    }

    console.log('API Key found (length):', apiKey.length);

    try {
        const groq = new Groq({ apiKey });

        console.log('Sending test request to Llama 3...');
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'user', content: 'Return JSON: {"status": "ok"}' }
            ],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        console.log('Response:', completion.choices[0]?.message?.content);
        console.log('✅ Groq API is working!');
    } catch (error) {
        console.error('❌ Groq API failed:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
    }
}

testGroq();
