# Student Fee Manager

A simple web app to manage student fees using HTML, CSS, JavaScript, and Neon PostgreSQL via Netlify Functions.

## Features

- Add students with name, room number, and lunch type
- Enter payments with total fees, paid amount, payment mode, and date
- Auto-calculate balance
- View student list with delete option
- View pending fees
- Payment history per student
- Cloud database with shared data across devices

## Setup

### 1. Neon Database
- Go to [Neon Console](https://console.neon.tech/)
- Create a new project
- In SQL Editor, run:
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT,
  room TEXT,
  lunch_type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  total_fees DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  payment_mode TEXT,
  date DATE,
  balance DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- Copy the connection string (postgresql://...)

### 2. Netlify Deployment
- Connect your GitHub repository to Netlify
- In Site Settings > Environment variables, add:
  - Key: `DATABASE_URL`
  - Value: Your Neon connection string
- Deploy the site

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Netlify Functions (serverless)
- Database: Neon PostgreSQL (cloud)