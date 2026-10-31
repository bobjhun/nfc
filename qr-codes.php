<?php
use chillerlan\QRCode\Output\QRGdImagePNG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

require_once __DIR__ . '/vendor/autoload.php';

session_start();

$pageTitle = 'QR Codes';
$pageDescription = 'Create and manage QR codes for your campaigns and content.';
$activePage = 'qr-codes';
$pageScript = 'js/qr-codes.js';
$successMessage = isset($_GET['created']) ? 'Your QR code has been saved.' : '';
$formError = '';
$formValues = ['qr_name' => '', 'qr_link' => ''];

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$pdo = null;
$qrCodes = [];
$databaseError = '';

try {
    $pdo = require __DIR__ . '/config/database.php';
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS qr_code (
            qr_name VARCHAR(120) NOT NULL,
            qr_link VARCHAR(2048) NOT NULL,
            date_added DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_qr_code_date_added (date_added)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
} catch (PDOException $exception) {
    error_log('QR code database connection or initialization failed: ' . $exception->getMessage());
    $databaseError = 'Could not connect to the social-media database. Check that MySQL is running and the database is available.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $pdo instanceof PDO) {
    $formValues['qr_name'] = trim((string) ($_POST['qr_name'] ?? ''));
    $formValues['qr_link'] = trim((string) ($_POST['qr_link'] ?? ''));
    $submittedToken = (string) ($_POST['csrf_token'] ?? '');

    if (!hash_equals($_SESSION['csrf_token'], $submittedToken)) {
        $formError = 'Your session has expired. Refresh the page and try again.';
    } elseif ($formValues['qr_name'] === '' || mb_strlen($formValues['qr_name']) > 120) {
        $formError = 'Enter a name that is between 1 and 120 characters.';
    } elseif (strlen($formValues['qr_link']) > 2048 || !filter_var($formValues['qr_link'], FILTER_VALIDATE_URL)) {
        $formError = 'Enter a valid link no longer than 2,048 characters.';
    } else {
        $urlParts = parse_url($formValues['qr_link']);
        if (
            !is_array($urlParts)
            || !isset($urlParts['scheme'], $urlParts['host'])
            || !in_array(strtolower($urlParts['scheme']), ['http', 'https'], true)
        ) {
            $formError = 'The QR Code Link must use an http or https URL.';
        } else {
            $imageDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'qr-images';
            $imageFile = hash('sha256', $formValues['qr_name'] . "\0" . $formValues['qr_link']) . '.png';
            $imagePath = $imageDirectory . DIRECTORY_SEPARATOR . $imageFile;
            $imageCreated = false;

            try {
                if (!is_dir($imageDirectory) && !mkdir($imageDirectory, 0755, true) && !is_dir($imageDirectory)) {
                    throw new RuntimeException('Unable to create the QR image directory.');
                }

                if (!is_file($imagePath)) {
                    $options = new QROptions([
                        'outputInterface' => QRGdImagePNG::class,
                        'outputBase64' => false,
                        'scale' => 6,
                    ]);
                    $pngData = (new QRCode($options))->render($formValues['qr_link']);
                    if (!is_string($pngData) || substr($pngData, 0, 8) !== "\x89PNG\r\n\x1a\n") {
                        throw new RuntimeException('QR image generation did not return a PNG image.');
                    }

                    $temporaryPath = tempnam($imageDirectory, 'qr-');
                    if ($temporaryPath === false) {
                        throw new RuntimeException('Unable to create a temporary QR image file.');
                    }

                    try {
                        if (file_put_contents($temporaryPath, $pngData, LOCK_EX) !== strlen($pngData)) {
                            throw new RuntimeException('Unable to write the generated QR image.');
                        }
                        if (!rename($temporaryPath, $imagePath)) {
                            throw new RuntimeException('Unable to save the generated QR image.');
                        }
                        $imageCreated = true;
                    } finally {
                        if (is_file($temporaryPath)) {
                            unlink($temporaryPath);
                        }
                    }
                }

                $statement = $pdo->prepare('INSERT INTO qr_code (qr_name, qr_link, date_added) VALUES (:qr_name, :qr_link, CURRENT_TIMESTAMP)');
                $statement->execute([
                    ':qr_name' => $formValues['qr_name'],
                    ':qr_link' => $formValues['qr_link'],
                ]);
                header('Location: qr-codes.php?created=1');
                exit;
            } catch (Throwable $exception) {
                if ($imageCreated && is_file($imagePath)) {
                    unlink($imagePath);
                }
                error_log('QR code save or image generation failed: ' . $exception->getMessage());
                $formError = 'The QR code could not be generated and saved. Please try again.';
            }
        }
    }
}

if ($pdo instanceof PDO) {
    try {
        $qrCodes = $pdo->query('SELECT qr_name, qr_link, date_added FROM qr_code ORDER BY date_added DESC')->fetchAll();
    } catch (PDOException $exception) {
        error_log('QR code list query failed: ' . $exception->getMessage());
        $databaseError = 'QR codes could not be loaded. Please refresh the page to try again.';
    }
}

function escapeHtml($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function qrImageUrl($name, $link)
{
    $filename = hash('sha256', $name . "\0" . $link) . '.png';
    return 'qr-images/' . rawurlencode($filename);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ascend Media Works — QR Codes</title>
  <meta name="description" content="Create and manage QR codes for Ascend Media Works." />
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
      <section class="qr-card">
        <div class="qr-card-heading">
          <div>
            <h2>Generated QR Codes</h2>
            <p>Keep your destination links ready to share.</p>
          </div>
          <button class="primary-button" id="openQrModal" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Create QR Code
          </button>
        </div>

        <?php if ($successMessage !== ''): ?>
          <p class="notice notice-success" role="status"><?php echo escapeHtml($successMessage); ?></p>
        <?php endif; ?>
        <?php if ($databaseError !== ''): ?>
          <p class="notice notice-error" role="alert"><?php echo escapeHtml($databaseError); ?></p>
        <?php endif; ?>

        <div class="table-scroll">
          <table class="qr-table">
            <thead>
              <tr>
                <th scope="col">QR Code</th>
                <th scope="col">Name</th>
                <th scope="col">QR Code Link</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              <?php if ($databaseError === '' && count($qrCodes) === 0): ?>
                <tr>
                  <td class="empty-state" colspan="4">No QR codes yet. Create one to get started.</td>
                </tr>
              <?php else: ?>
                <?php foreach ($qrCodes as $qrCode): ?>
                  <tr>
                    <td>
                      <button
                        class="qr-preview-trigger"
                        type="button"
                        data-qr-image="<?php echo escapeHtml(qrImageUrl($qrCode['qr_name'], $qrCode['qr_link'])); ?>"
                        data-qr-name="<?php echo escapeHtml($qrCode['qr_name']); ?>"
                        data-qr-link="<?php echo escapeHtml($qrCode['qr_link']); ?>"
                        aria-label="View QR code for <?php echo escapeHtml($qrCode['qr_name']); ?>"
                      >
                        <img
                          class="qr-preview"
                          src="<?php echo escapeHtml(qrImageUrl($qrCode['qr_name'], $qrCode['qr_link'])); ?>"
                          alt=""
                          width="72"
                          height="72"
                          loading="lazy"
                        />
                      </button>
                    </td>
                    <td class="qr-name"><?php echo escapeHtml($qrCode['qr_name']); ?></td>
                    <td class="qr-link"><a href="<?php echo escapeHtml($qrCode['qr_link']); ?>" target="_blank" rel="noopener noreferrer"><?php echo escapeHtml($qrCode['qr_link']); ?></a></td>
                    <td><?php echo escapeHtml(date('M j, Y', strtotime($qrCode['date_added']))); ?></td>
                  </tr>
                <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
        <p class="qr-disclosure">QR images are generated and stored locally.</p>
      </section>
    </main>
  </div>

  <dialog class="qr-view-dialog" id="qrViewModal" aria-labelledby="qrViewTitle">
    <div class="qr-view-content">
      <div class="qr-modal-heading">
        <div>
          <h2 id="qrViewTitle"></h2>
          <p>Scan this code to open its destination.</p>
        </div>
        <button class="modal-close" id="closeQrView" type="button" aria-label="Close dialog">&times;</button>
      </div>
      <img class="qr-view-image" id="qrViewImage" src="" alt="" />
      <a class="qr-view-link" id="qrViewDestination" href="" target="_blank" rel="noopener noreferrer"></a>
      <div class="qr-form-actions">
        <a class="primary-button qr-download-button" id="downloadQrImage" href="" download>Download QR Code</a>
      </div>
    </div>
  </dialog>

  <dialog class="qr-dialog" id="qrModal" aria-labelledby="qrModalTitle">
    <form method="post" action="qr-codes.php" class="qr-form">
      <div class="qr-modal-heading">
        <div>
          <h2 id="qrModalTitle">Create QR Code</h2>
          <p>Enter a name and the link this QR code should open.</p>
        </div>
        <button class="modal-close" id="closeQrModal" type="button" aria-label="Close dialog">&times;</button>
      </div>
      <?php if ($formError !== ''): ?>
        <p class="notice notice-error" role="alert"><?php echo escapeHtml($formError); ?></p>
      <?php endif; ?>
      <input type="hidden" name="csrf_token" value="<?php echo escapeHtml($_SESSION['csrf_token']); ?>" />
      <label class="form-field">
        <span>Name</span>
        <input type="text" name="qr_name" maxlength="120" required value="<?php echo escapeHtml($formValues['qr_name']); ?>" placeholder="e.g. Summer Campaign" />
      </label>
      <label class="form-field">
        <span>QR Code Link</span>
        <input type="url" name="qr_link" maxlength="2048" required value="<?php echo escapeHtml($formValues['qr_link']); ?>" placeholder="https://example.com" />
        <small>Use a complete http:// or https:// link.</small>
      </label>
      <div class="qr-form-actions">
        <button class="secondary-button" id="cancelQrModal" type="button">Cancel</button>
        <button class="primary-button" type="submit">Save QR Code</button>
      </div>
    </form>
  </dialog>

  <?php include __DIR__ . '/assets/footer.php'; ?>
