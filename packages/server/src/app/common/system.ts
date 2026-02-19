import env from 'env-var';
import path from 'path';
import * as dotenv from 'dotenv';
import { homedir } from 'os';

dotenv.config({ path:  path.join(process.cwd(), '.env') });

// Base directory for all OktaMan data
const OKTAMAN_HOME = path.join(homedir(), '.oktaman');

export const LOG_LEVEL = env.get('LOG_LEVEL').default('info').asString()

export const HOST = env.get('HOST').default('127.0.0.1').asString()
export const PORT = env.get('PORT').default(4321).asInt()

// Database configuration for SQLite - now in ~/.oktaman/
export const DB_PATH = env.get('DB_PATH').default(path.join(OKTAMAN_HOME, 'data.db')).asString()

// Working directory for command execution - ~/.oktaman/home/
export const WORKING_DIR = env.get('WORKING_DIR').default(path.join(OKTAMAN_HOME, 'home')).asString()

// Skills directory - ~/.oktaman/home/skills
export const SKILLS_DIR = path.join(WORKING_DIR, 'skills')

export const OKTAMAN_CONFIG_PATH = path.join(process.cwd(), 'cache/tools/pieces')

export const API_BASE_URL = env.get('API_BASE_URL').default('http://localhost:4200').asString()

// API Keys - These serve as fallback values when Settings table has no value configured
// Settings table takes precedence over these .env values
export const OPENROUTER_API_KEY = env.get('OPENROUTER_API_KEY').asString()
export const COMPOSIO_API_KEY = env.get('COMPOSIO_API_KEY').asString()
export const FIRECRAWL_API_KEY = env.get('FIRECRAWL_API_KEY').asString()
export const COMPOSIO_WEBHOOK_SECRET = env.get('COMPOSIO_WEBHOOK_SECRET').asString()

// Local file storage configuration - now in ~/.oktaman/storage
export const STORAGE_PATH = env.get('STORAGE_PATH').default(path.join(OKTAMAN_HOME, 'storage')).asString()