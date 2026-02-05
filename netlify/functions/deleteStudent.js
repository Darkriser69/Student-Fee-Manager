import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const id = event.queryStringParameters.id;

  try {
    await pool.query("DELETE FROM payments WHERE student_id = $1", [id]);
    await pool.query("DELETE FROM students WHERE id = $1", [id]);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Student and payments deleted" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}