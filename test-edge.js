const axios = require('axios');

async function testEdge() {
    try {
        const payload = {
            "customer_email": "test2@example.com",
            "customer_name": "Test User 2",
            "customer_phone": "081234567891",
            "status": "settled"
        };
        console.log("Sending to edge function...");
        const res = await axios.post('https://ghfnukejqcioulphszil.supabase.co/functions/v1/mayar-webhook', payload);
        console.log("Status:", res.status);
        console.log("Data:", res.data);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
testEdge();
