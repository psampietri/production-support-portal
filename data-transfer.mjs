import pg from 'pg';
// Use the robust import syntax for Prisma Client
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// --- CONFIGURATION ---
const oldDbConfig = {
  user: 'psampietri',
  host: 'localhost',
  database: 'onboarding_db',
  password: '',
  port: 5432,
};

const oldPool = new pg.Pool(oldDbConfig);

const toFieldKey = (label) => label.toLowerCase().replace(/ /g, '_');

async function main() {
  console.log('--- Starting Data Migration ---');
  const client = await oldPool.connect();

  try {
    await prisma.$transaction(async (tx) => {
      // --- 0. Clear Existing Data (Corrected Order) ---
      console.log('Clearing existing data from the destination database...');
      await tx.taskComment.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.auditLog.deleteMany({});
      await tx.onboardingTemplateTask.deleteMany({});
      await tx.taskTemplateDependency.deleteMany({});
      await tx.taskInstance.deleteMany({});
      await tx.onboardingInstance.deleteMany({});
      await tx.emailTemplate.deleteMany({});
      await tx.userCustomField.deleteMany({});
      await tx.onboardingTemplate.deleteMany({});
      await tx.taskTemplate.deleteMany({});
      await tx.user.deleteMany({});
      console.log('✅ Destination database cleared.');
      
      // --- 1. Migrate Custom Field Definitions ---
      console.log('Migrating custom field definitions...');
      const oldCustomColumns = [
        'Surname', 'KUMS_ID', 'ART', 'Team_Name', 'Contact_Person', 'Vendor_ID', 
        'CIANDT_GitHub_Username', 'start_date', 'location', 'team_role', 'audi_email'
      ];
      for (const columnName of oldCustomColumns) {
        await tx.userCustomField.create({
          data: { label: columnName.replace(/_/g, ' '), field_key: toFieldKey(columnName) }
        });
      }
      console.log(`✅ Migrated ${oldCustomColumns.length} custom field definitions.`);

      // --- 2. Migrate Users and Custom Fields ---
      console.log('Migrating users...');
      const { rows: oldUsers } = await client.query('SELECT * FROM users ORDER BY id ASC');
      for (const user of oldUsers) {
        const customFieldsData = {};
        for (const columnName of oldCustomColumns) {
            const fieldKey = toFieldKey(columnName);
            const value = user[columnName] ?? user[columnName.toLowerCase()];
            if (value != null) { customFieldsData[fieldKey] = value; }
        }
        await tx.user.create({
          data: {
            id: user.id, email: user.email, name: user.name, password_hash: user.password_hash,
            role: user.role, created_at: user.created_at, updated_at: user.updated_at,
            customFields: customFieldsData,
          },
        });
      }
      console.log(`✅ Migrated ${oldUsers.length} users.`);

      // --- 3. Migrate Other Tables (using createMany for efficiency) ---
      console.log('Migrating remaining data...');
      const { rows: oldTaskTemplates } = await client.query('SELECT * FROM task_templates');
      await tx.taskTemplate.createMany({ data: oldTaskTemplates.map(t => ({...t, config: t.config || undefined})) });

      const { rows: oldOnboardingTemplates } = await client.query('SELECT * FROM onboarding_templates');
      await tx.onboardingTemplate.createMany({ data: oldOnboardingTemplates });

      const { rows: oldOnboardingTemplateTasks } = await client.query('SELECT * FROM onboarding_template_tasks');
      await tx.onboardingTemplateTask.createMany({ data: oldOnboardingTemplateTasks });

      const { rows: oldDependencies } = await client.query('SELECT * FROM task_template_dependencies');
      await tx.taskTemplateDependency.createMany({ data: oldDependencies });

      const { rows: oldInstances } = await client.query('SELECT * FROM onboarding_instances');
      await tx.onboardingInstance.createMany({ data: oldInstances });

      const { rows: oldTaskInstances } = await client.query('SELECT * FROM task_instances');
      await tx.taskInstance.createMany({ data: oldTaskInstances.map(t => ({...t, ticket_info: t.ticket_info || undefined})) });
      
      const { rows: notifications } = await client.query('SELECT * FROM notifications');
      if (notifications.length > 0) await tx.notification.createMany({ data: notifications });
      
      const { rows: emailTemplates } = await client.query('SELECT * FROM email_templates');
      if (emailTemplates.length > 0) await tx.emailTemplate.createMany({ data: emailTemplates });

      const { rows: auditLogs } = await client.query('SELECT * FROM audit_logs');
      if (auditLogs.length > 0) await tx.auditLog.createMany({ data: auditLogs.map(l => ({...l, details: l.details || undefined})) });

      const { rows: taskComments } = await client.query('SELECT * FROM task_comments');
      if (taskComments.length > 0) await tx.taskComment.createMany({ data: taskComments });
      
      console.log('✅ All data migrated.');

    });

    console.log('\n🎉 --- Data migration completed successfully! --- 🎉');
  } catch (error) {
    console.error('\n❌ --- Data migration failed! --- ❌');
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