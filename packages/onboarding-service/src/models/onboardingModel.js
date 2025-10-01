import { pool } from '../../../database/client.js'

export const createOnboardingInstance = async (userId, templateId, assignedBy) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const instanceRes = await client.query(
            'INSERT INTO onboarding_instances (user_id, onboarding_template_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
            [userId, templateId, assignedBy]
        );
        const instance = instanceRes.rows[0];

        const tasksRes = await client.query(
            `SELECT tt.id AS task_template_id, array_agg(ttd.depends_on_id) AS dependencies 
             FROM onboarding_template_tasks ott 
             JOIN task_templates tt ON ott.task_template_id = tt.id 
             LEFT JOIN task_template_dependencies ttd ON tt.id = ttd.task_template_id 
             WHERE ott.onboarding_template_id = $1 
             GROUP BY tt.id`,
            [templateId]
        );

        for (const task of tasksRes.rows) {
            const hasDependencies = task.dependencies && task.dependencies[0] !== null;
            const status = hasDependencies ? 'blocked' : 'not_started';
            await client.query(
                'INSERT INTO task_instances (onboarding_instance_id, task_template_id, status) VALUES ($1, $2, $3)',
                [instance.id, task.task_template_id, status]
            );
        }

        await client.query('COMMIT');
        return instance;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const findActiveOnboardingByUserId = async (userId) => {
    const instanceRes = await pool.query(
        `SELECT oi.*, ot.name as template_name
         FROM onboarding_instances oi
         JOIN onboarding_templates ot ON oi.onboarding_template_id = ot.id
         WHERE oi.user_id = $1 AND oi.status IN ('in_progress', 'not_started')
         ORDER BY oi.created_at DESC
         LIMIT 1`,
        [userId]
    );

    if (instanceRes.rows.length === 0) {
        return null;
    }
    const instance = instanceRes.rows[0];

    const tasksRes = await pool.query(
        `SELECT 
            ti.*, 
            tt.name, 
            tt.description,
            tt.instructions, 
            tt.task_type,
            tt.config,
            COALESCE(deps.dependencies, '[]'::json) as dependencies
         FROM task_instances ti
         JOIN task_templates tt ON ti.task_template_id = tt.id
         LEFT JOIN (
             SELECT 
                 task_template_id, 
                 json_agg(depends_on_id) as dependencies
             FROM task_template_dependencies
             GROUP BY task_template_id
         ) deps ON ti.task_template_id = deps.task_template_id
         WHERE ti.onboarding_instance_id = $1
         ORDER BY ti.id`,
        [instance.id]
    );
    instance.tasks = tasksRes.rows;
    return instance;
};

export const findAllOnboardingInstances = async () => {
    const { rows } = await pool.query(
        `SELECT oi.id, oi.status, oi.created_at, u.name as user_name, a.name as admin_name, ot.name as template_name
         FROM onboarding_instances oi
         JOIN users u ON oi.user_id = u.id
         JOIN users a ON oi.assigned_by = a.id
         JOIN onboarding_templates ot ON oi.onboarding_template_id = ot.id
         ORDER BY oi.created_at DESC`
    );
    return rows;
};

export const findOnboardingInstanceById = async (id) => {
    const instanceRes = await pool.query(
        `SELECT oi.*, u.name as user_name, a.name as admin_name
         FROM onboarding_instances oi
         JOIN users u ON oi.user_id = u.id
         JOIN users a ON oi.assigned_by = a.id
         WHERE oi.id = $1`,
        [id]
    );
    if (instanceRes.rows.length === 0) {
        return null;
    }
    const instance = instanceRes.rows[0];

    const tasksRes = await pool.query(
        `SELECT 
            ti.*, 
            tt.name, 
            tt.description,
            tt.instructions, 
            tt.task_type,
            tt.config,
            COALESCE(deps.dependencies, '[]'::json) as dependencies
         FROM task_instances ti
         JOIN task_templates tt ON ti.task_template_id = tt.id
         LEFT JOIN (
             SELECT 
                 task_template_id, 
                 json_agg(depends_on_id) as dependencies
             FROM task_template_dependencies
             GROUP BY task_template_id
         ) deps ON ti.task_template_id = deps.task_template_id
         WHERE ti.onboarding_instance_id = $1
         ORDER BY ti.id`,
        [id]
    );
    instance.tasks = tasksRes.rows;
    return instance;
};

export const findTaskInstanceById = async (id, client = pool) => {
    const { rows } = await client.query(
        `SELECT 
            ti.*, 
            oi.user_id,
            tt.name, 
            tt.description,
            tt.instructions, 
            tt.task_type,
            tt.config
         FROM task_instances ti
         JOIN task_templates tt ON ti.task_template_id = tt.id
         JOIN onboarding_instances oi ON ti.onboarding_instance_id = oi.id
         WHERE ti.id = $1`,
        [id]
    );
    return rows[0];
};

export const findTasksByUserId = async (userId) => {
    const { rows } = await pool.query(
        `SELECT 
            ti.*, 
            tt.name, 
            tt.description,
            tt.instructions,
            tt.task_type,
            COALESCE(deps.dependencies, '[]'::json) as dependencies
         FROM task_instances ti
         JOIN onboarding_instances oi ON ti.onboarding_instance_id = oi.id
         JOIN task_templates tt ON ti.task_template_id = tt.id
         LEFT JOIN (
             SELECT 
                 task_template_id, 
                 json_agg(depends_on_id) as dependencies
             FROM task_template_dependencies
             GROUP BY task_template_id
         ) deps ON ti.task_template_id = deps.task_template_id
         WHERE oi.user_id = $1 AND oi.status != 'completed'`,
        [userId]
    );
    return rows;
};

export const updateTaskInstance = async (taskId, fields, client = pool) => {
    const fieldEntries = Object.entries(fields);
    const setClause = fieldEntries.map(([key], i) => `"${key}" = $${i + 1}`).join(', ');
    const values = fieldEntries.map(([, value]) => value);

    const { rows } = await client.query(
        `UPDATE task_instances SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fieldEntries.length + 1} RETURNING *`,
        [...values, taskId]
    );
    return rows[0];
};

export const findDependentTaskInstances = async (onboardingInstanceId, dependsOnId, client = pool) => {
    const { rows } = await client.query(
        `SELECT ti.id, ti.task_template_id, ti.status, ti.onboarding_instance_id
         FROM task_instances ti
         JOIN task_template_dependencies ttd ON ti.task_template_id = ttd.task_template_id
         WHERE ti.onboarding_instance_id = $1 AND ttd.depends_on_id = $2`,
        [onboardingInstanceId, dependsOnId]
    );
    return rows;
};

export const checkAllDependenciesComplete = async (onboardingInstanceId, taskTemplateId, client = pool) => {
    const { rows } = await client.query(
        `SELECT COUNT(*) as incomplete_dependencies
         FROM task_template_dependencies ttd
         JOIN task_instances ti ON ttd.depends_on_id = ti.task_template_id
         WHERE ttd.task_template_id = $1
           AND ti.onboarding_instance_id = $2
           AND ti.status != 'completed'`,
        [taskTemplateId, onboardingInstanceId]
    );
    return parseInt(rows[0].incomplete_dependencies, 10) === 0;
};

export const updateOnboardingInstance = async (id, { status }) => {
    const { rows } = await pool.query(
        'UPDATE onboarding_instances SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
    );
    return rows[0];
};

export const deleteOnboardingInstance = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM task_instances WHERE onboarding_instance_id = $1', [id]);
        await client.query('DELETE FROM onboarding_instances WHERE id = $1', [id]);
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const findCommentsByTaskId = async (taskId) => {
    const { rows } = await pool.query(
        `SELECT tc.*, u.name as user_name
         FROM task_comments tc
         JOIN users u ON tc.user_id = u.id
         WHERE tc.task_instance_id = $1
         ORDER BY tc.created_at ASC`,
        [taskId]
    );
    return rows;
};

export const createComment = async (taskId, userId, commentText) => {
    const { rows } = await pool.query(
        `INSERT INTO task_comments (task_instance_id, user_id, comment_text)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [taskId, userId, commentText]
    );
    return rows[0];
};

export const updateComment = async (commentId, userId, commentText) => {
    const { rows } = await pool.query(
        `UPDATE task_comments SET comment_text = $1
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [commentText, commentId, userId]
    );
    return rows[0];
};

export const deleteComment = async (commentId, userId) => {
    const { rowCount } = await pool.query(
        `DELETE FROM task_comments WHERE id = $1 AND user_id = $2`,
        [commentId, userId]
    );
    return rowCount;
};

export const findActiveInstancesByTemplateId = async (templateId, client = pool) => {
    const { rows } = await client.query(
        `SELECT * FROM onboarding_instances WHERE onboarding_template_id = $1 AND status IN ('not_started', 'in_progress')`,
        [templateId]
    );
    return rows;
};