<?php

function ga4EnsureSchema(PDO $pdo)
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS ga4_configuration (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            property_id VARCHAR(32) NOT NULL,
            service_account_email VARCHAR(255) NOT NULL,
            credential_file VARCHAR(80) NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

function ga4GetConfiguration(PDO $pdo)
{
    $statement = $pdo->query('SELECT property_id, service_account_email, credential_file FROM ga4_configuration WHERE id = 1');
    $configuration = $statement->fetch();

    return $configuration ?: null;
}

function ga4CredentialDirectory()
{
    return dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'social-media-private';
}

function ga4Escape($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}
