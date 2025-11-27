import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'company_db'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Employee Management System API' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Get all employees
app.get('/api/employees', (req, res) => {
  const sql = 'SELECT * FROM employees ORDER BY created_at DESC';
  
  db.query(sql, (err, data) => {
    if (err) return res.json(err);
    res.json(data);
  });
});

// Get single employee by ID
app.get('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM employees WHERE id = ?';
  
  db.query(sql, [id], (err, data) => {
    if (err) return res.json(err);
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(data[0]);
  });
});

// Create new employee
app.post('/api/employees', (req, res) => {
  const { name, salary, city } = req.body;

  // Validation
  if (!name || !salary || !city) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO employees (name, salary, city) VALUES (?, ?, ?)';
  const values = [name, salary, city];

  db.query(sql, values, (err, data) => {
    if (err) return res.json(err);
    
    res.json({ 
      id: data.insertId,
      message: 'Employee created successfully'
    });
  });
});

// Update employee
app.put('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  const { name, salary, city } = req.body;

  // Validation
  if (!name || !salary || !city) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'UPDATE employees SET name = ?, salary = ?, city = ? WHERE id = ?';
  const values = [name, salary, city, id];

  db.query(sql, values, (err, data) => {
    if (err) return res.json(err);
    
    if (data.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee updated successfully' });
  });
});

// Delete employee
app.delete('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM employees WHERE id = ?';

  db.query(sql, [id], (err, data) => {
    if (err) return res.json(err);
    
    if (data.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;