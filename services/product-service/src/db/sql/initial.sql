CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text UNIQUE NOT NULL,
    description text NOT NULL,
    price decimal(12,2) NOT NULL
);

CREATE TABLE stocks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid UNIQUE NOT NULL,
    count integer NOT NULL,
    FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
);

INSERT INTO products (id, title, description, price) VALUES
    ('7567ec4b-b10c-48c5-9345-fc73c48a80aa', 'ProductOne', 'Short Product Description1', 2.4),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a0', 'ProductNew', 'Short Product Description3', 10),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a2', 'ProductTop', 'Short Product Description2', 23),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a1', 'ProductTitle', 'Short Product Description7', 15),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a3', 'Product', 'Short Product Description2', 23),
    ('7567ec4b-b10c-48c5-9345-fc73348a80a1', 'ProductTest', 'Short Product Description4', 15),
    ('7567ec4b-b10c-48c5-9445-fc73c48a80a2', 'Product2', 'Short Product Descriptio1', 23),
    ('7567ec4b-b10c-45c5-9345-fc73c48a80a1', 'ProductName', 'Short Product Description7', 15)
;

INSERT INTO stocks (product_id, count) VALUES
    ('7567ec4b-b10c-48c5-9345-fc73c48a80aa', 4),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a0', 6),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a2', 7),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a1', 12),
    ('7567ec4b-b10c-48c5-9345-fc73c48a80a3', 7),
    ('7567ec4b-b10c-48c5-9345-fc73348a80a1', 8),
    ('7567ec4b-b10c-48c5-9445-fc73c48a80a2', 2),
    ('7567ec4b-b10c-45c5-9345-fc73c48a80a1', 3)
;
