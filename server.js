const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
// const db = new sqlite3.Database('./property_management.db');
// temperary solution, not suitable for production
const db = new sqlite3.Database('/tmp/property_management.db');

// Initialize database tables
db.serialize(() => {
    // Properties table
    db.run(`
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            total_units INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Units table
    db.run(`
        CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER,
            unit_number TEXT NOT NULL,
            rent_amount REAL NOT NULL,
            status TEXT DEFAULT 'vacant',
            FOREIGN KEY (property_id) REFERENCES properties(id)
        )
    `);

    // Tenants table
    db.run(`
        CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_id INTEGER,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            move_in_date DATE,
            move_out_date DATE,
            FOREIGN KEY (unit_id) REFERENCES units(id)
        )
    `);

    // Bills table
    db.run(`
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            due_date DATE NOT NULL,
            status TEXT DEFAULT 'pending',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
    `);

    // Payments table
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER,
            tenant_id INTEGER,
            amount REAL NOT NULL,
            payment_date DATE NOT NULL,
            payment_method TEXT,
            transaction_id TEXT,
            FOREIGN KEY (bill_id) REFERENCES bills(id),
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
    `);
});

// API Routes

// Properties
app.get('/api/properties', (req, res) => {
    db.all('SELECT * FROM properties', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/properties', (req, res) => {
    const { name, address, total_units } = req.body;
    db.run('INSERT INTO properties (name, address, total_units) VALUES (?, ?, ?)',
        [name, address, total_units], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, name, address, total_units });
    });
});

// Units
app.get('/api/units', (req, res) => {
    const { property_id } = req.query;
    let sql = 'SELECT * FROM units';
    let params = [];

    if (property_id) {
        sql += ' WHERE property_id = ?';
        params.push(property_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/units', (req, res) => {
    const { property_id, unit_number, rent_amount, status } = req.body;
    db.run('INSERT INTO units (property_id, unit_number, rent_amount, status) VALUES (?, ?, ?, ?)',
        [property_id, unit_number, rent_amount, status], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, property_id, unit_number, rent_amount, status });
    });
});

// Tenants
app.get('/api/tenants', (req, res) => {
    const { unit_id } = req.query;
    let sql = `
        SELECT t.*, u.unit_number, p.name as property_name
        FROM tenants t
        LEFT JOIN units u ON t.unit_id = u.id
        LEFT JOIN properties p ON u.property_id = p.id
    `;
    let params = [];

    if (unit_id) {
        sql += ' WHERE t.unit_id = ?';
        params.push(unit_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/tenants', (req, res) => {
    const { unit_id, name, phone, email, move_in_date } = req.body;
    db.run('INSERT INTO tenants (unit_id, name, phone, email, move_in_date) VALUES (?, ?, ?, ?, ?)',
        [unit_id, name, phone, email, move_in_date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Update unit status to occupied
        db.run('UPDATE units SET status = "occupied" WHERE id = ?', [unit_id]);
        res.json({ id: this.lastID, unit_id, name, phone, email, move_in_date });
    });
});

// Bills
app.get('/api/bills', (req, res) => {
    const { tenant_id, status } = req.query;
    let sql = `
        SELECT b.*, t.name as tenant_name, u.unit_number
        FROM bills b
        LEFT JOIN tenants t ON b.tenant_id = t.id
        LEFT JOIN units u ON t.unit_id = u.id
    `;
    let params = [];

    if (tenant_id) {
        sql += ' WHERE b.tenant_id = ?';
        params.push(tenant_id);
    }

    if (status) {
        sql += tenant_id ? ' AND b.status = ?' : ' WHERE b.status = ?';
        params.push(status);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/bills', (req, res) => {
    const { tenant_id, type, amount, due_date, description } = req.body;
    db.run('INSERT INTO bills (tenant_id, type, amount, due_date, description) VALUES (?, ?, ?, ?, ?)',
        [tenant_id, type, amount, due_date, description], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, tenant_id, type, amount, due_date, description });
    });
});

// Payments
app.get('/api/payments', (req, res) => {
    const { tenant_id } = req.query;
    let sql = `
        SELECT p.*, b.type as bill_type, t.name as tenant_name, u.unit_number
        FROM payments p
        LEFT JOIN bills b ON p.bill_id = b.id
        LEFT JOIN tenants t ON p.tenant_id = t.id
        LEFT JOIN units u ON t.unit_id = u.id
    `;
    let params = [];

    if (tenant_id) {
        sql += ' WHERE p.tenant_id = ?';
        params.push(tenant_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/payments', (req, res) => {
    const { bill_id, tenant_id, amount, payment_date, payment_method } = req.body;
    const transaction_id = uuidv4();

    db.run('INSERT INTO payments (bill_id, tenant_id, amount, payment_date, payment_method, transaction_id) VALUES (?, ?, ?, ?, ?, ?)',
        [bill_id, tenant_id, amount, payment_date, payment_method, transaction_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Update bill status to paid
        db.run('UPDATE bills SET status = "paid" WHERE id = ?', [bill_id]);

        res.json({ id: this.lastID, bill_id, tenant_id, amount, payment_date, payment_method, transaction_id });
    });
});

// Dashboard statistics
app.get('/api/dashboard', (req, res) => {
    const stats = {};

    // Total properties
    db.get('SELECT COUNT(*) as total FROM properties', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalProperties = row.total;

        // Total units
        db.get('SELECT COUNT(*) as total FROM units', (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalUnits = row.total;

            // Total tenants
            db.get('SELECT COUNT(*) as total FROM tenants WHERE move_out_date IS NULL', (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalTenants = row.total;

                // Monthly revenue
                db.get('SELECT SUM(amount) as total FROM payments WHERE strftime("%Y-%m", payment_date) = strftime("%Y-%m", "now")',
                    (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.monthlyRevenue = row.total || 0;

                    // Pending bills
                    db.get('SELECT SUM(amount) as total FROM bills WHERE status = "pending"', (err, row) => {
                        if (err) return res.status(500).json({ error: err.message });
                        stats.pendingBills = row.total || 0;

                        res.json(stats);
                    });
                });
            });
        });
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Property Management System running on port ${PORT}`);
});