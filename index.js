require('dotenv').config();
const mysql = require("mysql2");
const express = require('express');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection for Aiven
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.MY_SQLPORT || 28635,
  ssl: {
    rejectUnauthorized: false // Set to true if you have CA certificate
  }
});

// Connect to database and initialize tables
// Connect to database and initialize tables
db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
  
  // Create employees table if it doesn't exist
  createEmployeesTable();
});

// Function to create employees table
const createEmployeesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      salary DECIMAL(10, 2) NOT NULL,
      city VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Error creating employees table:', err);
    } else {
      console.log('✅ Employees table checked/created successfully');
      
      // Check if table is empty and insert sample data
      checkAndInsertSampleData();
    }
  });
};

// Function to insert sample data if table is empty
const checkAndInsertSampleData = () => {
  const checkDataQuery = 'SELECT COUNT(*) as count FROM employees';
  
  db.query(checkDataQuery, (err, results) => {
    if (err) {
      console.error('Error checking employee data:', err);
      return;
    }
    
    const employeeCount = results[0].count;
    
    if (employeeCount === 0) {
      console.log('📝 No employees found, inserting sample data...');
      
      const sampleEmployees = [
        ['John Doe', 50000, 'New York'],
        ['Jane Smith', 60000, 'Los Angeles'],
        ['Mike Johnson', 55000, 'Chicago']
      ];
      
      const insertQuery = 'INSERT INTO employees (name, salary, city) VALUES ?';
      
      db.query(insertQuery, [sampleEmployees], (insertErr) => {
        if (insertErr) {
          console.error('Error inserting sample data:', insertErr);
        } else {
          console.log('✅ Sample employees inserted successfully');
        }
      });
    } else {
      console.log(`✅ Found ${employeeCount} existing employees`);
    }
  });
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Employee Management System API',
    database: 'connected',
    table: 'employees'
  });
});

app.get('/api/health', (req, res) => {
  // Test database and table
  db.query('SELECT 1 as test FROM employees LIMIT 1', (err) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Database error',
        error: err.message
      });
    }
    res.json({ 
      message: 'Server and database are running!',
      table: 'employees exists'
    });
  });
});

// Get all employees
app.get('/api/employees', (req, res) => {
  console.log('📥 Fetching employees...');
  const sql = 'SELECT * FROM employees ORDER BY created_at DESC';
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    console.log(`✅ Found ${data.length} employees`);
    res.json(data);
  });
});

// Get employee by ID
app.get('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM employees WHERE id = ?';
  db.query(sql, [id], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(data[0]);
  });
});

// Create employee
app.post('/api/employees', (req, res) => {
  const { name, salary, city } = req.body;
  if (!name || !salary || !city) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO employees (name, salary, city) VALUES (?, ?, ?)';
  db.query(sql, [name, parseFloat(salary), city], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
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
  if (!name || !salary || !city) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'UPDATE employees SET name = ?, salary = ?, city = ? WHERE id = ?';
  db.query(sql, [name, parseFloat(salary), city, id], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee updated successfully' });
  });
});

// Delete employee
app.delete('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM employees WHERE id = ?';
  db.query(sql, [id], (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (data.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/employees`);
});