const { getHabits } = require('./src/controllers/habitController');
const dotenv = require('dotenv');
dotenv.config();

const req = {
    user: { id: 'test-user-id' },
    headers: { authorization: 'Bearer test-token' }
};

const res = {
    json: (data) => console.log('Response JSON:', data),
    status: (code) => ({
        json: (data) => console.log(`Response ${code}:`, data)
    })
};

console.log('Running debug-controller...');
getHabits(req, res);
