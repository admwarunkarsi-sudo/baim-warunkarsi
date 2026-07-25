const payload = {
    customer: {
        email: 'test_webhook_service_role@example.com',
        name: 'Service Role Tester',
        phone: '085111222333'
    },
    status: 'settled'
};

fetch('http://localhost:3000/api/webhook/mayar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
}).then(async r => {
    console.log(r.status, await r.text());
});
