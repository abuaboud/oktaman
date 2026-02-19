import { DataSource } from 'typeorm';
import { DB_PATH } from '../common/system';
import * as path from 'path';
import { SessionEntitySchema } from '../brain/session.entity';
import { SessionSubscriber } from '../brain/session.subscriber';
import { AgentEntity } from '../agent/agent.entity';
import { AgentSubscriber } from '../agent/agent.subscriber';
import { MemoryBlockEntitySchema } from '../memory-block/memory-block.entity';
import { ChannelEntitySchema } from '../brain/channels/channel.entity';
import { SettingsEntitySchema } from '../settings/settings.entity';

export const databaseConnection = new DataSource({
    type: 'better-sqlite3',
    database: DB_PATH,
    synchronize: true,
    logging: false,
    entities: [
        SessionEntitySchema,
        AgentEntity,
        MemoryBlockEntitySchema,
        ChannelEntitySchema,
        SettingsEntitySchema
    ],
    migrations: [path.join(__dirname, '../database/migrations/**/*{.ts,.js}')],
    subscribers: [
        SessionSubscriber,
        AgentSubscriber,
    ],
});


// Initialize the data source
export const initializeDatabase = async () => {
    try {
        await databaseConnection.initialize();
        console.log('SQLite database initialized at:', DB_PATH);

        // TODO: Load sqlite-vss extension for vector similarity search
        // This will be configured in the memory block service

        const pendingMigrations = await databaseConnection.showMigrations();
        if (pendingMigrations) {
            console.log('Running database migrations...');
            await databaseConnection.runMigrations();
            console.log('Database migrations applied successfully!');
        } else {
            console.log('No pending migrations found.');
        }

    } catch (error) {
        console.error('Error during Data Source initialization or migrations:', error);
        throw error;
    }
};
