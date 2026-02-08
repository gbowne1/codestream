
import { login } from './src/controllers/AuthControllers.js';
import User from './src/models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock Response Object
const mockRes = () => {
    const res = {};
    res.statusCode = 200; // Default
    res.body = {};

    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    res.send = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

// Mock Dependencies
const originalFindOne = User.findOne;
const originalCompare = bcrypt.compare;
const originalSign = jwt.sign;

async function runTests() {
    console.log('--- Starting Auth Controller Tests (Local Verification) ---\n');
    let passed = 0;
    let failed = 0;

    // Helper for assertions
    const assert = (desc, actual, expected) => {
        if (actual === expected) {
            console.log(` ${desc}: PASSED`);
            passed++;
        } else {
            console.log(` ${desc}: FAILED (Expected ${expected}, got ${actual})`);
            failed++;
        }
    };

    // TEST 1: Missing Fields (400)
    {
        console.log('\nTest 1: Missing Fields');
        const req = { body: {} };
        const res = mockRes();

        await login(req, res);

        assert('Status Code', res.statusCode, 400);
        assert('Error Message', res.body?.message, 'Please fill out all fields.');
    }

    // TEST 2: User Not Found (401)
    {
        console.log('\nTest 2: User Not Found');
        const req = { body: { email: 'wrong@example.com', password: 'pass' } };
        const res = mockRes();

        // Mock User.findOne to return null
        User.findOne = async () => null;

        await login(req, res);

        assert('Status Code', res.statusCode, 401);
        assert('Error Message', res.body?.message, 'Invalid email or password.');
    }

    // TEST 3: Wrong Password (401) - This validates the fix (was 444)
    {
        console.log('\nTest 3: Wrong Password');
        const req = { body: { email: 'user@example.com', password: 'wrongpass' } };
        const res = mockRes();

        // Mock User.findOne to return a user
        User.findOne = async () => ({
            id: '123',
            email: 'user@example.com',
            password: 'hashedpassword',
            role: 'user'
        });

        // Mock bcrypt.compare to return false
        bcrypt.compare = async () => false;

        await login(req, res);

        assert('Status Code', res.statusCode, 401);
        assert('Error Message', res.body?.message, 'Invalid email or password.');
    }

    // TEST 4: Valid Login (200)
    {
        console.log('\nTest 4: Valid Login');
        const req = { body: { email: 'user@example.com', password: 'correctpass' } };
        const res = mockRes();

        // Mock User.findOne to return a user
        User.findOne = async () => ({
            id: '123',
            username: 'test',
            email: 'user@example.com',
            password: 'hashedpassword',
            role: 'user'
        });

        // Mock bcrypt.compare to return true
        bcrypt.compare = async () => true;

        // Mock jwt.sign
        jwt.sign = () => 'mock_token';

        await login(req, res);

        const isSuccess = res.body?.token === 'mock_token';
        if (isSuccess) {
            console.log(`Valid Login Token: PASSED`);
            passed++;
        } else {
            console.log(`Valid Login Token: FAILED`);
            failed++;
        }
    }

    // Restore mocks
    User.findOne = originalFindOne;
    bcrypt.compare = originalCompare;
    jwt.sign = originalSign;

    console.log(`\n--- Tests Completed: ${passed} Passed, ${failed} Failed ---`);
}

runTests().catch(console.error);
