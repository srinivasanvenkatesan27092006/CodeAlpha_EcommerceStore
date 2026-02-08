# Simple E-Commerce Store

A basic e-commerce website built with Express.js (Node.js) backend and HTML/CSS/JavaScript frontend.

## Features

- **Product Listings**: Browse and view products
- **Product Details**: Detailed product information pages
- **User Authentication**: Registration and login system
- **Shopping Cart**: Add/remove items from cart
- **Order Processing**: Complete checkout process
- **Order History**: View past orders
- **Database**: SQLite database for storing products, users, and orders

## Technology Stack

- **Backend**: Express.js (Node.js)
- **Frontend**: HTML, CSS, JavaScript, EJS templating
- **Database**: SQLite3
- **Authentication**: bcryptjs for password hashing
- **Session Management**: express-session

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── ecommerce.db          # SQLite database (created automatically)
├── views/                # EJS templates
│   ├── index.ejs         # Home page with product listings
│   ├── product.ejs       # Product detail page
│   ├── register.ejs      # User registration
│   ├── login.ejs         # User login
│   ├── cart.ejs          # Shopping cart
│   ├── checkout.ejs      # Checkout process
│   └── orders.ejs        # Order history
├── public/               # Static files
│   └── css/
│       └── style.css     # Stylesheets
└── README.md             # This file
```

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts and authentication
- **products**: Product information
- **orders**: Order records
- **order_items**: Products within each order
- **cart_items**: User shopping cart items

## Usage

1. **Register/Login**: Create an account or login to start shopping
2. **Browse Products**: View available products on the home page
3. **Product Details**: Click on any product to see detailed information
4. **Add to Cart**: Add products to your shopping cart
5. **Checkout**: Complete the checkout process with shipping and payment information
6. **View Orders**: Check your order history after making purchases

## Sample Products

The application comes with 5 sample products pre-loaded:
- Laptop ($999.99)
- Smartphone ($699.99)
- Headphones ($199.99)
- Smartwatch ($299.99)
- Tablet ($449.99)

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Customization

You can easily customize:
- Add more products by inserting into the `products` table
- Modify the UI by editing CSS files in `public/css/`
- Extend functionality by adding new routes in `server.js`
- Update the database schema as needed

## Development

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

The database file (`ecommerce.db`) will be created automatically when you first run the application.
