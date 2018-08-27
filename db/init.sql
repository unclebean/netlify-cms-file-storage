CREATE TABLE IF NOT EXISTS editorial_workflow (
    content_name      VARCHAR(200) PRIMARY KEY,
    status            VARCHAR(80) NOT NULL,
    author            VARCHAR(60),
    creation_date     date,
    expiry_date       date
);