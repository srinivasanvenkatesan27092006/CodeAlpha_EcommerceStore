const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Explicitly handle SVG files with correct MIME type
app.get('/images/:filename', (req, res, next) => {
    const filename = req.params.filename;
    if (filename.endsWith('.svg')) {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, 'public', 'images', filename);
        
        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.sendFile(filePath);
        } else {
            res.status(404).send('Image not found');
        }
    } else if (filename.endsWith('.bmp')) {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, 'public', 'images', filename);
        
        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'image/bmp');
            res.sendFile(filePath);
        } else {
            res.status(404).send('Image not found');
        }
    } else {
        // Let static middleware handle other files
        next();
    }
});

app.use(express.static('public'));
app.use(session({
    secret: 'ecommerce-secret-key-2024-secure',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database setup
const db = new sqlite3.Database('./ecommerce.db');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Something went wrong!', 
        error: err 
    });
});

// Input validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateUsername(username) {
    return username && username.length >= 3 && username.length <= 20;
}

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Cart items table
    db.run(`CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        UNIQUE(user_id, product_id)
    )`);

    // Insert sample products
    const stmt = db.prepare("INSERT OR IGNORE INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)");
    stmt.run("MacBook Pro 16\"", "Apple MacBook Pro with M3 Max chip, 16-inch Liquid Retina XDR display", 2499.99, "/images/product-image.svg", 8);
    stmt.run("iPhone 15 Pro Max", "Latest iPhone with titanium design, A17 Pro chip, 48MP camera system", 1199.99, "/images/product-image.svg", 12);
    stmt.run("Sony WH-1000XM5", "Premium wireless noise-canceling headphones with exceptional sound quality", 399.99, "/images/product-image.svg", 15);
    stmt.run("Apple Watch Ultra 2", "Advanced smartwatch with health monitoring, GPS, and titanium case", 799.99, "/images/product-image.svg", 10);
    stmt.run("iPad Pro 12.9\"", "Professional tablet with M2 chip, Liquid Retina XDR display, Apple Pencil support", 1099.99, "/images/product-image.svg", 6);
    stmt.finalize();
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Routes
app.get('/', (req, res) => {
    db.all("SELECT * FROM products ORDER BY created_at DESC", (err, products) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching products");
        }
        res.render('index', { products, user: req.session.userId, username: req.session.username });
    });
});

app.get('/images', (req, res) => {
    db.all("SELECT * FROM products ORDER BY created_at DESC", (err, products) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching products");
        }
        res.render('images', { products });
    });
});

// Test route to check image accessibility
app.get('/test-images', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const imageDir = path.join(__dirname, 'public', 'images');
    
    fs.readdir(imageDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading images directory' });
        }
        
        const imageFiles = files.filter(file => file.endsWith('.svg'));
        res.json({ 
            message: 'Images directory contents',
            files: imageFiles,
            imagePath: '/images/',
            fullPaths: imageFiles.map(file => `/images/${file}`)
        });
    });
});

app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching product");
        }
        if (!product) {
            return res.status(404).send("Product not found");
        }
        res.render('product', { product, user: req.session.userId, username: req.session.username });
    });
});

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
        return res.render('register', { error: "All fields are required" });
    }
    
    if (!validateUsername(username)) {
        return res.render('register', { error: "Username must be 3-20 characters long" });
    }
    
    if (!validateEmail(email)) {
        return res.render('register', { error: "Please enter a valid email address" });
    }
    
    if (!validatePassword(password)) {
        return res.render('register', { error: "Password must be at least 6 characters long" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        
        db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", 
            [username, email, hashedPassword], 
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('username')) {
                            return res.render('register', { error: "Username already exists" });
                        } else if (err.message.includes('email')) {
                            return res.render('register', { error: "Email already exists" });
                        }
                    }
                    console.error(err);
                    return res.status(500).render('register', { error: "Registration failed. Please try again." });
                }
                req.session.userId = this.lastID;
                req.session.username = username;
                res.redirect('/');
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).render('register', { error: "Registration failed. Please try again." });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
        return res.render('login', { error: "Username and password are required" });
    }
    
    if (!validateUsername(username)) {
        return res.render('login', { error: "Invalid username or password" });
    }
    
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).render('login', { error: "Login failed. Please try again." });
        }
        
        if (!user) {
            return res.render('login', { error: "Invalid username or password" });
        }
        
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                req.session.username = user.username;
                res.redirect('/');
            } else {
                res.render('login', { error: "Invalid username or password" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).render('login', { error: "Login failed. Please try again." });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/cart', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const query = `
        SELECT ci.*, p.name, p.price, p.image_url 
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.user_id = ?
    `;
    
    db.all(query, [userId], (err, cartItems) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching cart");
        }
        
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        res.render('cart', { cartItems, total, user: req.session.userId, username: req.session.username });
    });
});

app.post('/cart/add', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const { productId, quantity } = req.body;
    
    // Validation
    if (!productId || !quantity) {
        return res.status(400).send("Product ID and quantity are required");
    }
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 99) {
        return res.status(400).send("Invalid quantity");
    }
    
    // Check if product exists and has enough stock
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error adding to cart");
        }
        
        if (!product) {
            return res.status(404).send("Product not found");
        }
        
        if (product.stock < qty) {
            return res.status(400).send("Insufficient stock");
        }
    
        db.run(`INSERT OR REPLACE INTO cart_items (user_id, product_id, quantity) 
                VALUES (?, ?, COALESCE((SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?), 0) + ?)`,
            [userId, productId, userId, productId, qty],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error adding to cart");
                }
                res.redirect('/cart');
            }
        );
    });
});

app.post('/cart/remove', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const { productId } = req.body;
    
    db.run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [userId, productId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error removing from cart");
        }
        res.redirect('/cart');
    });
});

app.get('/checkout', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const query = `
        SELECT ci.*, p.name, p.price, p.stock 
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.user_id = ?
    `;
    
    db.all(query, [userId], (err, cartItems) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching cart");
        }
        
        if (cartItems.length === 0) {
            return res.redirect('/cart');
        }
        
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        res.render('checkout', { cartItems, total, user: req.session.userId, username: req.session.username });
    });
});

app.post('/checkout', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    
    const query = `
        SELECT ci.*, p.name, p.price, p.stock 
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.user_id = ?
    `;
    
    db.all(query, [userId], (err, cartItems) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error during checkout");
        }
        
        if (cartItems.length === 0) {
            return res.redirect('/cart');
        }
        
        // Check stock availability
        for (const item of cartItems) {
            if (item.quantity > item.stock) {
                return res.status(400).send(`Insufficient stock for ${item.name}`);
            }
        }
        
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            // Create order
            db.run("INSERT INTO orders (user_id, total_amount) VALUES (?, ?)", [userId, total], function(err) {
                if (err) {
                    db.run("ROLLBACK");
                    console.error(err);
                    return res.status(500).send("Error creating order");
                }
                
                const orderId = this.lastID;
                
                // Add order items
                const stmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
                let hasError = false;
                
                for (const item of cartItems) {
                    stmt.run([orderId, item.product_id, item.quantity, item.price], (err) => {
                        if (err) {
                            hasError = true;
                        }
                    });
                }
                
                stmt.finalize(() => {
                    if (hasError) {
                        db.run("ROLLBACK");
                        return res.status(500).send("Error creating order items");
                    }
                    
                    // Update stock
                    const updateStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
                    hasError = false;
                    
                    for (const item of cartItems) {
                        updateStmt.run([item.quantity, item.product_id], (err) => {
                            if (err) {
                                hasError = true;
                            }
                        });
                    }
                    
                    updateStmt.finalize(() => {
                        if (hasError) {
                            db.run("ROLLBACK");
                            return res.status(500).send("Error updating stock");
                        }
                        
                        // Clear cart
                        db.run("DELETE FROM cart_items WHERE user_id = ?", [userId], (err) => {
                            if (err) {
                                db.run("ROLLBACK");
                                return res.status(500).send("Error clearing cart");
                            }
                            
                            db.run("COMMIT");
                            res.redirect('/orders');
                        });
                    });
                });
            });
        });
    });
});

app.get('/orders', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const query = `
        SELECT o.*, oi.product_id, oi.quantity, oi.price, p.name as product_name
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching orders");
        }
        
        // Group order items by order
        const orders = {};
        rows.forEach(row => {
            if (!orders[row.id]) {
                orders[row.id] = {
                    id: row.id,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                };
            }
            if (row.product_id) {
                orders[row.id].items.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price: row.price
                });
            }
        });
        
        res.render('orders', { orders: Object.values(orders), user: req.session.userId, username: req.session.username });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
