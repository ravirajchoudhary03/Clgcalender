const { createHabit } = require('./src/controllers/habitController');

const req = {
    user: { id: 'test-user-id' },
    headers: { authorization: 'Bearer test-token' },
    body: { title: 'coding', color: '#60A5FA' }
};

const res = {
    json: (data) => console.log('Success:', data),
    status: (code) => ({
        json: (data) => console.log(`Error ${code}:`, data)
    })
};

console.log('Testing createHabit...');
createHabit(req, res).catch(e => console.error('Crashed:', e));
