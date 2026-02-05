import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = JSON.parse(event.body);

  const { name, room, lunchType } = data;

  try {
    await pool.query(
      "INSERT INTO students(name, room, lunch_type) VALUES($1, $2, $3)",
      [name, room, lunchType]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Student added" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}