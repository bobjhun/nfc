CREATE TABLE IF NOT EXISTS nfc_businesses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  google_review_url VARCHAR(2048) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nfc_businesses_slug (slug),
  KEY idx_nfc_businesses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nfc_cards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id BIGINT UNSIGNED NULL,
  card_identifier CHAR(32) NOT NULL,
  redirect_url VARCHAR(2048) NULL,
  expected_ndef_url VARCHAR(2048) NULL,
  expected_url_hash CHAR(64) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  programming_status ENUM('unprogrammed', 'registered', 'programmed', 'failed')
    NOT NULL DEFAULT 'unprogrammed',
  last_programmed_at DATETIME NULL,
  last_verified_at DATETIME NULL,
  last_scanned_at DATETIME NULL,
  last_operation_result ENUM('success', 'failure', 'mismatch', 'invalid') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nfc_cards_identifier (card_identifier),
  KEY idx_nfc_cards_expected_url_hash (expected_url_hash),
  KEY idx_nfc_cards_business (business_id),
  KEY idx_nfc_cards_status (status, programming_status),
  KEY idx_nfc_cards_last_scanned (last_scanned_at),
  CONSTRAINT fk_nfc_cards_business
    FOREIGN KEY (business_id) REFERENCES nfc_businesses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nfc_operations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  card_id BIGINT UNSIGNED NULL,
  operation_type ENUM('scan', 'write', 'verify', 'register') NOT NULL,
  result ENUM('success', 'failure', 'mismatch', 'invalid') NOT NULL,
  scanned_url VARCHAR(2048) NULL,
  expected_url VARCHAR(2048) NULL,
  error_message VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nfc_operations_card_created (card_id, created_at),
  KEY idx_nfc_operations_type_created (operation_type, created_at),
  CONSTRAINT fk_nfc_operations_card
    FOREIGN KEY (card_id) REFERENCES nfc_cards (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nfc_redirect_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nfc_redirect_visits_business_created (business_id, created_at),
  CONSTRAINT fk_nfc_redirect_visits_business
    FOREIGN KEY (business_id) REFERENCES nfc_businesses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
