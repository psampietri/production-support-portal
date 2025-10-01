import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../models/userModel.js';
import logger from '@production-support-portal/logger';

const SECRET_KEY = process.env.SECRET_KEY;

export const registerUser = async (userData) => {
    const { email, password, name } = userData;
    if (!email || !password || !name) {
        throw new Error('Email, password, and name are required fields.');
    }

    logger.info({ email }, `Registering user.`);
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        logger.warn({ email }, 'User registration failed: email already exists.');
        throw new Error('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Prepare user data for creation, replacing password with the hash
    const userToCreate = {
        ...userData,
        password_hash: hashedPassword,
    };
    delete userToCreate.password;

    const newUser = await createUser(userToCreate);
    logger.info({ userId: newUser.id, email }, 'User created successfully.');
    
    return newUser;
};

export const loginUser = async (email, password) => {
    logger.info({ email }, `Login attempt.`);
    
    const user = await findUserByEmail(email);
    if (!user) {
        logger.warn({ email }, 'Login failed: User not found.');
        throw new Error('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        logger.warn({ email }, 'Login failed: Invalid password.');
        throw new Error('Invalid credentials.');
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    logger.info({ userId: user.id, email }, 'User logged in successfully.');

    // eslint-disable-next-line no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};