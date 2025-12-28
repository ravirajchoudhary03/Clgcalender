async function param() {
    try {
        const res = await fetch('http://localhost:5001/api/habits', {
            headers: { 'Authorization': 'Bearer invalid_token' }
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch failed:', e.cause || e);
    }
}
param();
