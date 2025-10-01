import { pool } from '../../../database/client.js'

export const getAverageCompletionTime = async () => {
    const { rows } = await pool.query(
        `SELECT
            EXTRACT(EPOCH FROM AVG(updated_at - created_at)) / 3600 as avg_hours
         FROM onboarding_instances
         WHERE status = 'completed'`
    );
    return rows[0]?.avg_hours ? parseFloat(rows[0].avg_hours) : null;
};

export const countActiveOnboardings = async () => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) FROM onboarding_instances WHERE status = 'in_progress'"
    );
    return parseInt(rows[0].count, 10);
};

export const countCompletedOnboardings = async () => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) FROM onboarding_instances WHERE status = 'completed'"
    );
    return parseInt(rows[0].count, 10);
};

export const countTotalUsers = async () => {
    const { rows } = await pool.query("SELECT COUNT(*) FROM users");
    return parseInt(rows[0].count, 10);
};

export const getStatusDistribution = async () => {
    const { rows } = await pool.query(
        `SELECT status as name, COUNT(*) as value FROM onboarding_instances GROUP BY status`
    );
    return rows;
};

export const getTaskTypeDistribution = async () => {
    const { rows } = await pool.query(
        `SELECT tt.task_type as name, COUNT(ti.id) as value
         FROM task_instances ti
         JOIN task_templates tt ON ti.task_template_id = tt.id
         GROUP BY tt.task_type`
    );
    return rows;
};

export const getCompletionTrend = async () => {
    const { rows } = await pool.query(
        `WITH date_series AS (
            SELECT generate_series(
                CURRENT_DATE - interval '13 days',
                CURRENT_DATE,
                '1 day'::interval
            )::date AS day
        )
        SELECT
            to_char(ds.day, 'Mon DD') as date,
            COALESCE(s.started_count, 0) AS started,
            COALESCE(c.completed_count, 0) AS completed
        FROM date_series ds
        LEFT JOIN (
            SELECT created_at::date AS day, COUNT(*) AS started_count
            FROM onboarding_instances
            WHERE created_at >= CURRENT_DATE - interval '13 days'
            GROUP BY day
        ) s ON ds.day = s.day
        LEFT JOIN (
            SELECT updated_at::date AS day, COUNT(*) AS completed_count
            FROM onboarding_instances
            WHERE status = 'completed' AND updated_at >= CURRENT_DATE - interval '13 days'
            GROUP BY day
        ) c ON ds.day = c.day
        ORDER BY ds.day;`
    );
    return rows;
};
