import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const oldDbConfig = {
    user: process.env.OLD_DB_USER,
    host: process.env.OLD_DB_HOST,
    database: process.env.OLD_DB_DATABASE,
    password: process.env.OLD_DB_PASSWORD,
    port: process.env.OLD_DB_PORT,
};

const oldPool = new pg.Pool(oldDbConfig);

async function migrateData() {
    console.log('Starting data migration...');
    const client = await oldPool.connect();

    try {
        await prisma.$transaction(async (tx) => {
            console.log('Fetching data from old database...');

            // --- 1. Migrate Users ---
            const usersRes = await client.query('SELECT * FROM users');
            for (const user of usersRes.rows) {
                await tx.user.create({
                    data: {
                        id: user.id,
                        username: user.username,
                        password: user.password,
                        role: user.role,
                        email: user.email,
                        createdAt: user.created_at,
                    },
                });
            }
            console.log(`Migrated ${usersRes.rowCount} users.`);

            // --- 2. Migrate Onboarding Templates ---
            const templatesRes = await client.query('SELECT * FROM onboarding_templates');
            for (const template of templatesRes.rows) {
                await tx.onboardingTemplate.create({
                    data: {
                        id: template.id,
                        name: template.name,
                        description: template.description,
                        createdBy: template.created_by,
                        createdAt: template.created_at,
                        updatedAt: template.updated_at,
                    },
                });
            }
            console.log(`Migrated ${templatesRes.rowCount} onboarding templates.`);

            // --- 3. Migrate Task Templates (handling dependencies) ---
            const taskTemplatesRes = await client.query('SELECT * FROM task_templates ORDER BY parent_id ASC NULLS FIRST');
            for (const task of taskTemplatesRes.rows) {
                await tx.taskTemplate.create({
                    data: {
                        id: task.id,
                        onboardingTemplateId: task.onboarding_template_id,
                        title: task.title,
                        description: task.description,
                        type: task.type,
                        config: task.config || {},
                        parentId: task.parent_id,
                        createdAt: task.created_at,
                    },
                });
            }
             console.log(`Migrated ${taskTemplatesRes.rowCount} task templates.`);


            console.log('Data migration completed successfully!');
        });
    } catch (error) {
        console.error('Data migration failed:', error);
    } finally {
        client.release();
        await oldPool.end();
        await prisma.$disconnect();
    }
}

migrateData();