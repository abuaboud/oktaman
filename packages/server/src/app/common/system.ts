import env from 'env-var';
import path from 'path';
import * as dotenv from 'dotenv';
import { homedir } from 'os';

dotenv.config({ path:  path.join(process.cwd(), '.env') });

// Base directory for all OktaMan data
const OKTAMAN_HOME = path.join(homedir(), '.oktaman');

export const LOG_LEVEL = env.get('LOG_LEVEL').default('info').asString()

export const HOST = env.get('HOST').default('127.0.0.1').asString()
export const PORT = env.get('PORT').default(3333).asInt()

// Database configuration for SQLite - now in ~/.oktaman/
export const DB_PATH = env.get('DB_PATH').default(path.join(OKTAMAN_HOME, 'data.db')).asString()

// Working directory for command execution - ~/.oktaman/home/
export const WORKING_DIR = env.get('WORKING_DIR').default(path.join(OKTAMAN_HOME, 'home')).asString()

// Skills directory - ~/.oktaman/home/skills
export const SKILLS_DIR = path.join(WORKING_DIR, 'skills')

export const OKTAMAN_CONFIG_PATH = path.join(process.cwd(), 'cache/tools/pieces')

export const API_BASE_URL = env.get('API_BASE_URL').default('http://localhost:4200').asString()

// Local file storage configuration - now in ~/.oktaman/storage
export const STORAGE_PATH = env.get('STORAGE_PATH').default(path.join(OKTAMAN_HOME, 'storage')).asString()