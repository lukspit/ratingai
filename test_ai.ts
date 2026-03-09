import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testai() {
    try {
        const { callAI } = await import('./src/utils/ai.ts');
        console.log("Calling AI with Default Model...");
        const res = await callAI([{ role: 'user', content: 'Say hello world and output JSON {"hello": "world"}' }], true);
        console.log("Result:", res);
    } catch (e) {
        console.error("Error calling AI:", e);
    }
}

testai();
