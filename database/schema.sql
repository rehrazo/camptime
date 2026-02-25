-- E-commerce Database Schema with Extended Product Fields

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Basic Information
    spu_no VARCHAR(255) UNIQUE,
    item_no VARCHAR(255),
    url VARCHAR(500),
    category VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255),
    brand VARCHAR(255),
    sku_code VARCHAR(255) UNIQUE,
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    msrp DECIMAL(10, 2),
    map DECIMAL(10, 2),
    dropshipping_price DECIMAL(10, 2),
    
    -- Inventory
    stock_quantity INT DEFAULT 0,
    inventory_location VARCHAR(255),
    
    -- Shipping
    shipping_method VARCHAR(255),
    shipping_limitations TEXT,
    processing_time VARCHAR(100),
    
    -- Content
    description TEXT,
    html_description LONGTEXT,
    
    -- Identifiers
    upc VARCHAR(255),
    asin VARCHAR(255),
    
    -- Media
    product_video VARCHAR(500),
    additional_resources VARCHAR(500),
    
    -- Policies & Rules
    prohibited_marketplace VARCHAR(255),
    return_refund_policy TEXT,
    return_address TEXT,
    
    -- Product Dimensions
    product_length DECIMAL(10, 2),
    product_width DECIMAL(10, 2),
    product_height DECIMAL(10, 2),
    product_size_unit VARCHAR(50),
    product_weight DECIMAL(10, 2),
    product_weight_unit VARCHAR(50),
    
    -- Packaging
    number_of_packages INT DEFAULT 1,
    packaging_size_unit VARCHAR(50),
    packaging_weight_unit VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_order INT,
    is_additional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX (product_id)
);

CREATE TABLE product_variations (
    variation_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    theme_name VARCHAR(255),
    variation_value VARCHAR(255),
    variation_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX (product_id)
);

CREATE TABLE product_parameters (
    parameter_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    parameter_name VARCHAR(255),
    parameter_value TEXT,
    parameter_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX (product_id)
);

CREATE TABLE product_packaging (
    packaging_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    package_number INT,
    size VARCHAR(100),
    weight DECIMAL(10, 2),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX (product_id)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    total DECIMAL(10, 2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_group_id INT,
    status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (shipping_group_id) REFERENCES shipping_groups(shipping_group_id)
);

CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX (order_id)
);

CREATE TABLE tax_groups (
    tax_group_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(5, 4) NOT NULL
);

CREATE TABLE shipping_groups (
    shipping_group_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL
);

CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    contact_number VARCHAR(20),
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE support_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE email_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL
);

CREATE TABLE blog_posts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    quantity INT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX (product_id)
);

CREATE TABLE analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    product_id INT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(255) NOT NULL,
    user_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
