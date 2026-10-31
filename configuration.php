<?php
session_start();
require_once __DIR__ . '/config/ga4.php';

$pageTitle = 'Configuration';
$pageDescription = 'Connect your Google Analytics 4 property to view its reports.';
$activePage = 'configuration';
$formError = '';
$successMessage = isset($_GET['saved']) ? 'Google Analytics configuration saved.' : '';
$propertyId = '';
$serviceAccountEmail = '';
$credentialsConfigured = false;
$pdo = null;
$configurationError = '';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

try {
    $pdo = require __DIR__ . '/config/database.php';
    ga4EnsureSchema($pdo);
    $configuration = ga4GetConfiguration($pdo);
    if ($configuration !== null) {
        $propertyId = $configuration['property_id'];
        $serviceAccountEmail = $configuration['service_account_email'];
        $credentialPath = ga4CredentialDirectory() . DIRECTORY_SEPARATOR . basename($configuration['credential_file']);
        $credentialsConfigured = is_file($credentialPath);
    }
} catch (PDOException $exception) {
    error_log('GA4 configuration database error: ' . $exception->getMessage());
    $configurationError = 'The database is unavailable. Start MySQL and try again.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $pdo instanceof PDO && $configurationError === '') {
    $propertyId = trim((string) ($_POST['property_id'] ?? ''));
    $submittedToken = (string) ($_POST['csrf_token'] ?? '');
    $credentialsUpload = $_FILES['service_account_json'] ?? null;

    if (!hash_equals($_SESSION['csrf_token'], $submittedToken)) {
        $formError = 'Your session has expired. Refresh the page and try again.';
    } elseif (!preg_match('/^[0-9]{1,32}$/', $propertyId)) {
        $formError = 'Enter the numeric GA4 Property ID, not the Measurement ID.';
    } else {
        $newCredentialFile = null;
        $newCredentialPath = null;
        $newServiceAccountEmail = $serviceAccountEmail;

        if (is_array($credentialsUpload) && $credentialsUpload['error'] !== UPLOAD_ERR_NO_FILE) {
            if ($credentialsUpload['error'] !== UPLOAD_ERR_OK) {
                $formError = 'The service-account JSON upload failed. Please try again.';
            } elseif ($credentialsUpload['size'] > 1048576) {
                $formError = 'The service-account JSON file must be 1 MB or smaller.';
            } else {
                $json = file_get_contents($credentialsUpload['tmp_name']);
                $credentials = is_string($json) ? json_decode($json, true) : null;
                if (
                    !is_array($credentials)
                    || ($credentials['type'] ?? '') !== 'service_account'
                    || !filter_var($credentials['client_email'] ?? '', FILTER_VALIDATE_EMAIL)
                    || !is_string($credentials['private_key'] ?? null)
                    || strpos($credentials['private_key'], '-----BEGIN PRIVATE KEY-----') === false
                    || !is_string($credentials['project_id'] ?? null)
                ) {
                    $formError = 'Upload a valid Google service-account JSON key file.';
                } else {
                    $directory = ga4CredentialDirectory();
                    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
                        $formError = 'The private credentials folder could not be created. Check PHP folder permissions.';
                    } else {
                        $newCredentialFile = bin2hex(random_bytes(20)) . '.json';
                        $newCredentialPath = $directory . DIRECTORY_SEPARATOR . $newCredentialFile;
                        $temporaryPath = tempnam($directory, 'ga4-');
                        if ($temporaryPath === false) {
                            $formError = 'A temporary credentials file could not be created.';
                        } elseif (file_put_contents($temporaryPath, $json, LOCK_EX) !== strlen($json)) {
                            @unlink($temporaryPath);
                            $formError = 'The credentials file could not be saved. Check PHP folder permissions.';
                        } elseif (!rename($temporaryPath, $newCredentialPath)) {
                            @unlink($temporaryPath);
                            $formError = 'The credentials file could not be saved. Check PHP folder permissions.';
                        } else {
                            @chmod($newCredentialPath, 0600);
                            $newServiceAccountEmail = $credentials['client_email'];
                        }
                    }
                }
            }
        } elseif (!$credentialsConfigured) {
            $formError = 'Upload the service-account JSON key file to connect this property.';
        }

        if ($formError === '') {
            try {
                $oldCredentialFile = $configuration['credential_file'] ?? null;
                if ($newCredentialFile !== null) {
                    $statement = $pdo->prepare(
                        'INSERT INTO ga4_configuration (id, property_id, service_account_email, credential_file)
                         VALUES (1, :property_id, :service_account_email, :credential_file)
                         ON DUPLICATE KEY UPDATE property_id = VALUES(property_id),
                           service_account_email = VALUES(service_account_email),
                           credential_file = VALUES(credential_file)'
                    );
                    $statement->execute([
                        ':property_id' => $propertyId,
                        ':service_account_email' => $newServiceAccountEmail,
                        ':credential_file' => $newCredentialFile,
                    ]);
                    if ($oldCredentialFile !== null && $oldCredentialFile !== $newCredentialFile) {
                        $oldPath = ga4CredentialDirectory() . DIRECTORY_SEPARATOR . basename($oldCredentialFile);
                        if (is_file($oldPath)) {
                            unlink($oldPath);
                        }
                    }
                } else {
                    $statement = $pdo->prepare('UPDATE ga4_configuration SET property_id = :property_id WHERE id = 1');
                    $statement->execute([':property_id' => $propertyId]);
                }

                header('Location: configuration.php?saved=1');
                exit;
            } catch (PDOException $exception) {
                if ($newCredentialPath !== null && is_file($newCredentialPath)) {
                    unlink($newCredentialPath);
                }
                error_log('GA4 configuration save failed: ' . $exception->getMessage());
                $formError = 'Your GA4 settings could not be saved. Please try again.';
            }
        } elseif ($newCredentialPath !== null && is_file($newCredentialPath)) {
            unlink($newCredentialPath);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ascend Media Works — Configuration</title>
  <meta name="description" content="Configure Google Analytics 4 for Ascend Media Works." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <div class="app app-compact">
    <?php include __DIR__ . '/assets/sidebar.php'; ?>
    <main class="main qr-page">
      <?php include __DIR__ . '/assets/topbar.php'; ?>
      <section class="qr-card configuration-card">
        <div class="qr-card-heading">
          <div>
            <h2>Google Analytics 4</h2>
            <p>Connect a GA4 property to load account reports in Analytics.</p>
          </div>
          <span class="connection-status <?php echo $credentialsConfigured ? 'is-connected' : ''; ?>">
            <span></span><?php echo $credentialsConfigured ? 'Credentials added' : 'Not connected'; ?>
          </span>
        </div>

        <?php if ($configurationError !== ''): ?>
          <p class="notice notice-error" role="alert"><?php echo ga4Escape($configurationError); ?></p>
        <?php endif; ?>
        <?php if ($formError !== ''): ?>
          <p class="notice notice-error" role="alert"><?php echo ga4Escape($formError); ?></p>
        <?php endif; ?>
        <?php if ($successMessage !== ''): ?>
          <p class="notice notice-success" role="status"><?php echo ga4Escape($successMessage); ?></p>
        <?php endif; ?>

        <form method="post" enctype="multipart/form-data" class="configuration-form">
          <input type="hidden" name="csrf_token" value="<?php echo ga4Escape($_SESSION['csrf_token']); ?>" />
          <label class="form-field">
            <span>GA4 Property ID</span>
            <input type="text" inputmode="numeric" pattern="[0-9]{1,32}" name="property_id" required value="<?php echo ga4Escape($propertyId); ?>" placeholder="e.g. 123456789" />
            <small>Find it in GA4 under Admin → Property settings. This is not the Measurement ID (G-...).</small>
          </label>
          <label class="form-field">
            <span>Service-account JSON key</span>
            <input type="file" name="service_account_json" accept=".json,application/json" <?php echo $credentialsConfigured ? '' : 'required'; ?> />
            <small>
              <?php if ($credentialsConfigured): ?>
                Current account: <?php echo ga4Escape($serviceAccountEmail); ?>. Leave empty to keep the existing key.
              <?php else: ?>
                Upload a JSON key for a Google Cloud service account with GA4 Viewer access.
              <?php endif; ?>
            </small>
          </label>
          <div class="configuration-actions">
            <button class="primary-button" type="submit">Save Google Analytics Settings</button>
          </div>
        </form>

        <div class="setup-guide">
          <h3>Setup checklist</h3>
          <ol>
            <li>Enable the <strong>Google Analytics Data API</strong> in your Google Cloud project.</li>
            <li>Create a service account and download its JSON key.</li>
            <li>Enter the numeric GA4 Property ID, upload the JSON key above, and save.</li>
            <li>Add the displayed service-account email as a <strong>Viewer</strong> on the GA4 property.</li>
          </ol>
          <p>The key is stored outside the public web folder and is never saved in the database. Never share it or commit it to source control.</p>
        </div>
      </section>
    </main>
  </div>
  <?php include __DIR__ . '/assets/footer.php'; ?>
