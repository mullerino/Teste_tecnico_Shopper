CREATE DATABASE IF NOT EXISTS shopper;

USE shopper;

CREATE TABLE IF NOT EXISTS measures (
    customer_code VARCHAR(255) NOT NULL,
    measure_uuid CHAR(36) NOT NULL PRIMARY KEY,
    measure_datetime DATETIME NOT NULL,
    measure_type ENUM('WATER', 'GAS') NOT NULL,
    has_confirmed TINYINT(1) NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    measure_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);
