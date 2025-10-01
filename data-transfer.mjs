import pg from 'pg';
import { PrismaClient } from './packages/database/node_modules/.prisma/client/index.js';

const prisma = new PrismaClient();

// --- CONFIGURATION ---
// TODO: Configure this object to connect to your OLD `onboarding_tool` database.
const oldDbConfig = {
  user: 'psampietri',
  host: 'localhost',
  database: 'onboarding_db',
  password: '',
  port: 5432,
};

const oldPool = new pg.Pool(oldDbConfig);

async function main() {
  console.log('--- Starting Data Migration ---');
  const client = await oldPool.connect();

  try {
    await prisma.$transaction(async (tx) => {
      // --- 1. Migrate Users ---
      console.log('Migrating users...');
      const { rows: oldUsers } = await client.query('SELECT * FROM users ORDER BY id ASC');
      for (const user of oldUsers) {
        // Separate core fields from custom fields
        const customFields = {
          Surname: user.Surname,
          KUMS_ID: user.KUMS_ID,
          ART: user.ART,
          Team_Name: user.Team_Name,
          Contact_Person: user.Contact_Person,
          Vendor_ID: user.Vendor_ID,
          CIANDT_GitHub_Username: user.CIANDT_GitHub_Username,
          start_date: user.start_date,
          location: user.location,
          team_role: user.team_role,
          audi_email: user.audi_email,
        };

        await tx.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            password_hash: user.password_hash,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
            customFields: customFields,
          },
        });
      }
      console.log(`✅ Migrated ${oldUsers.length} users.`);

      // --- 2. Migrate Task Templates ---
      console.log('Migrating task templates...');
      const { rows: oldTaskTemplates } = await client.query('SELECT * FROM task_templates ORDER BY id ASC');
      for (const template of oldTaskTemplates) {
        await tx.taskTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            description: template.description,
            instructions: template.instructions,
            task_type: template.task_type,
            config: template.config || undefined,
            created_by: template.created_by,
            created_at: template.created_at,
            updated_at: template.updated_at,
          },
        });
      }
      console.log(`✅ Migrated ${oldTaskTemplates.length} task templates.`);

      // --- 3. Migrate Onboarding Templates ---
      console.log('Migrating onboarding templates...');
      const { rows: oldOnboardingTemplates } = await client.query('SELECT * FROM onboarding_templates ORDER BY id ASC');
      for (const template of oldOnboardingTemplates) {
        await tx.onboardingTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            description: template.description,
            created_by: template.created_by,
            created_at: template.created_at,
            updated_at: template.updated_at,
          },
        });
      }
      console.log(`✅ Migrated ${oldOnboardingTemplates.length} onboarding templates.`);
      
      // --- 4. Migrate Onboarding Template Tasks (Join Table) ---
      console.log('Migrating onboarding template task relations...');
      const { rows: oldOnboardingTemplateTasks } = await client.query('SELECT * FROM onboarding_template_tasks');
      for (const relation of oldOnboardingTemplateTasks) {
        await tx.onboardingTemplateTask.create({
          data: {
            onboarding_template_id: relation.onboarding_template_id,
            task_template_id: relation.task_template_id,
            order: relation.order,
          },
        });
      }
      console.log(`✅ Migrated ${oldOnboardingTemplateTasks.length} template task relations.`);

      // --- 5. Migrate Task Template Dependencies ---
      console.log('Migrating task template dependencies...');
      const { rows: oldDependencies } = await client.query('SELECT * FROM task_template_dependencies');
      for (const dep of oldDependencies) {
        await tx.taskTemplateDependency.create({
          data: {
            task_template_id: dep.task_template_id,
            depends_on_id: dep.depends_on_id,
          },
        });
      }
      console.log(`✅ Migrated ${oldDependencies.length} task dependencies.`);

      // --- 6. Migrate Onboarding Instances ---
      console.log('Migrating onboarding instances...');
      const { rows: oldInstances } = await client.query('SELECT * FROM onboarding_instances ORDER BY id ASC');
      for (const instance of oldInstances) {
        await tx.onboardingInstance.create({
          data: {
            id: instance.id,
            user_id: instance.user_id,
            onboarding_template_id: instance.onboarding_template_id,
            status: instance.status,
            assigned_by: instance.assigned_by,
            created_at: instance.created_at,
            updated_at: instance.updated_at,
          },
        });
      }
      console.log(`✅ Migrated ${oldInstances.length} onboarding instances.`);

      // --- 7. Migrate Task Instances ---
      console.log('Migrating task instances...');
      const { rows: oldTaskInstances } = await client.query('SELECT * FROM task_instances ORDER BY id ASC');
      for (const task of oldTaskInstances) {
        await tx.taskInstance.create({
          data: {
            id: task.id,
            onboarding_instance_id: task.onboarding_instance_id,
            task_template_id: task.task_template_id,
            status: task.status,
            ticket_info: task.ticket_info || undefined,
            issue_key: task.issue_key,
            is_bypassed: task.is_bypassed,
            task_started_at: task.task_started_at,
            task_completed_at: task.task_completed_at,
            ticket_created_at: task.ticket_created_at,
            ticket_closed_at: task.ticket_closed_at,
            created_at: task.created_at,
            updated_at: task.updated_at,
          },
        });
      }
      console.log(`✅ Migrated ${oldTaskInstances.length} task instances.`);

      // --- Add other tables like notifications, email_templates, audit_logs, task_comments here ---
      console.log('Migration complete. Remember to migrate other tables if needed.');

    });

    console.log('\n🎉 --- Data migration completed successfully! --- 🎉');
  } catch (error) {
    console.error('\n❌ --- Data migration failed! --- ❌');
    console.error('An error occurred during the transaction. No data was written to the new database.');
    console.error('Error Details:', error);
  } finally {
    await client.release();
    await oldPool.end();
    await prisma.$disconnect();
    console.log('Database connections closed.');
  }
}

main().catch((e) => {
  throw e;
});
