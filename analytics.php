<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/ga4.php';

use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;
use Google\Analytics\Data\V1beta\OrderBy\DimensionOrderBy;
use Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy;
use Google\Analytics\Data\V1beta\RunReportRequest;

$pageTitle = 'Analytics';
$pageDescription = 'Google Analytics 4 performance over the last 30 days.';
$activePage = 'analytics';
$pdo = null;
$configuration = null;
$databaseError = '';
$reportError = '';
$totals = ['activeUsers' => 0, 'newUsers' => 0, 'sessions' => 0, 'screenPageViews' => 0, 'engagementRate' => 0];
$dailyRows = [];
$topPages = [];
$channels = [];
$devices = [];
$countries = [];

try {
    $pdo = require __DIR__ . '/config/database.php';
    ga4EnsureSchema($pdo);
    $configuration = ga4GetConfiguration($pdo);
} catch (PDOException $exception) {
    error_log('GA4 analytics configuration database error: ' . $exception->getMessage());
    $databaseError = 'The database is unavailable. Start MySQL and check the connection settings.';
}

if ($databaseError === '' && $configuration === null) {
    $reportError = 'Connect a GA4 property in Configuration to see your reports.';
} elseif ($databaseError === '' && $configuration !== null) {
    $credentialPath = ga4CredentialDirectory() . DIRECTORY_SEPARATOR . basename($configuration['credential_file']);
    if (!is_file($credentialPath)) {
        $reportError = 'The service-account key is missing. Upload it again in Configuration.';
    } else {
        $client = null;
        try {
            $client = new BetaAnalyticsDataClient([
                'credentials' => $credentialPath,
                'transport' => 'rest',
            ]);
            $property = 'properties/' . $configuration['property_id'];
            $dateRange = [new DateRange(['start_date' => '29daysAgo', 'end_date' => 'today'])];

            $aggregateRequest = (new RunReportRequest())
                ->setProperty($property)
                ->setDateRanges($dateRange)
                ->setMetrics([
                    new Metric(['name' => 'activeUsers']),
                    new Metric(['name' => 'newUsers']),
                    new Metric(['name' => 'sessions']),
                    new Metric(['name' => 'screenPageViews']),
                    new Metric(['name' => 'engagementRate']),
                ]);
            $aggregateReport = $client->runReport($aggregateRequest);
            $aggregateRow = $aggregateReport->getRows()[0] ?? null;
            if ($aggregateRow !== null) {
                foreach (array_keys($totals) as $index => $metricName) {
                    $totals[$metricName] = (float) $aggregateRow->getMetricValues()[$index]->getValue();
                }
            }

            $dailyRequest = (new RunReportRequest())
                ->setProperty($property)
                ->setDateRanges($dateRange)
                ->setDimensions([new Dimension(['name' => 'date'])])
                ->setMetrics([
                    new Metric(['name' => 'activeUsers']),
                    new Metric(['name' => 'sessions']),
                ])
                ->setOrderBys([
                    new OrderBy(['dimension' => new DimensionOrderBy(['dimension_name' => 'date'])]),
                ]);
            foreach ($client->runReport($dailyRequest)->getRows() as $row) {
                $dailyRows[] = [
                    'date' => $row->getDimensionValues()[0]->getValue(),
                    'users' => (int) $row->getMetricValues()[0]->getValue(),
                    'sessions' => (int) $row->getMetricValues()[1]->getValue(),
                ];
            }

            $pageRequest = (new RunReportRequest())
                ->setProperty($property)
                ->setDateRanges($dateRange)
                ->setDimensions([new Dimension(['name' => 'pageTitle'])])
                ->setMetrics([new Metric(['name' => 'screenPageViews'])])
                ->setLimit(8)
                ->setOrderBys([
                    new OrderBy(['metric' => new MetricOrderBy(['metric_name' => 'screenPageViews']), 'desc' => true]),
                ]);
            foreach ($client->runReport($pageRequest)->getRows() as $row) {
                $topPages[] = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                    'value' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }

            $channelRequest = (new RunReportRequest())
                ->setProperty($property)
                ->setDateRanges($dateRange)
                ->setDimensions([new Dimension(['name' => 'sessionDefaultChannelGroup'])])
                ->setMetrics([new Metric(['name' => 'sessions'])])
                ->setLimit(8)
                ->setOrderBys([
                    new OrderBy(['metric' => new MetricOrderBy(['metric_name' => 'sessions']), 'desc' => true]),
                ]);
            foreach ($client->runReport($channelRequest)->getRows() as $row) {
                $channels[] = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                    'value' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }

            $deviceRequest = (new RunReportRequest())
                ->setProperty($property)
                ->setDateRanges($dateRange)
                ->setDimensions([new Dimension(['name' => 'deviceCategory'])])
                ->setMetrics([new Metric(['name' => 'activeUsers'])])
                ->setOrderBys([
                    new OrderBy(['metric' => new MetricOrderBy(['metric_name' => 'activeUsers']), 'desc' => true]),
                ]);
            foreach ($client->runReport($deviceRequest)->getRows() as $row) {
                $devices[] = [
                    'name' => ucfirst($row->getDimensionValues()[0]->getValue()),
                    'value' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }

            $countryRequest = (new RunReportRequest())
                ->setProperty($property)
                ->setDateRanges($dateRange)
                ->setDimensions([new Dimension(['name' => 'country'])])
                ->setMetrics([new Metric(['name' => 'activeUsers'])])
                ->setLimit(8)
                ->setOrderBys([
                    new OrderBy(['metric' => new MetricOrderBy(['metric_name' => 'activeUsers']), 'desc' => true]),
                ]);
            foreach ($client->runReport($countryRequest)->getRows() as $row) {
                $countries[] = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                    'value' => (int) $row->getMetricValues()[0]->getValue(),
                ];
            }
        } catch (Throwable $exception) {
            error_log('GA4 report request failed: ' . $exception->getMessage());
            $reportError = 'GA4 could not return reports. Check that the Analytics Data API is enabled and the service account has Viewer access to this property.';
            $totals = ['activeUsers' => 0, 'newUsers' => 0, 'sessions' => 0, 'screenPageViews' => 0, 'engagementRate' => 0];
            $dailyRows = $topPages = $channels = $devices = $countries = [];
        } finally {
            if ($client instanceof BetaAnalyticsDataClient) {
                $client->close();
            }
        }
    }
}

function analyticsFormatNumber($number)
{
    return number_format((float) $number);
}

function analyticsChartPoints($rows, $field, $width = 700, $height = 220, $maxValue = null)
{
    if (count($rows) === 0) {
        return '';
    }

    $values = array_map(function ($row) use ($field) {
        return (float) $row[$field];
    }, $rows);
    $maxValue = max(1, $maxValue ?? max($values));
    $lastIndex = max(1, count($rows) - 1);

    $points = [];
    foreach ($values as $index => $value) {
        $x = 8 + ($index / $lastIndex) * ($width - 16);
        $y = $height - 10 - (($value / $maxValue) * ($height - 24));
        $points[] = number_format($x, 1, '.', '') . ',' . number_format($y, 1, '.', '');
    }

    return implode(' ', $points);
}

function analyticsMaxValue($rows)
{
    return max(1, max(array_map(function ($row) {
        return (int) $row['value'];
    }, $rows ?: [['value' => 0]])));
}

$hasReportData = $configuration !== null && $reportError === '' && $databaseError === '';
$dailyChartMax = 1;
foreach ($dailyRows as $dailyRow) {
    $dailyChartMax = max($dailyChartMax, $dailyRow['users'], $dailyRow['sessions']);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ascend Media Works — Analytics</title>
  <meta name="description" content="Google Analytics 4 website statistics and trends." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <div class="app app-compact">
    <?php include __DIR__ . '/assets/sidebar.php'; ?>
    <main class="main qr-page analytics-page">
      <?php include __DIR__ . '/assets/topbar.php'; ?>
      <?php if ($databaseError !== '' || $reportError !== ''): ?>
        <p class="notice notice-error analytics-notice" role="alert"><?php echo ga4Escape($databaseError !== '' ? $databaseError : $reportError); ?></p>
      <?php endif; ?>
      <?php if ($configuration !== null): ?>
        <p class="analytics-property">GA4 Property ID: <strong><?php echo ga4Escape($configuration['property_id']); ?></strong> <span>· Last 30 days</span></p>
      <?php endif; ?>

      <section class="analytics-stat-grid" aria-label="Google Analytics summary">
        <article class="analytics-stat-card"><span>Active users</span><strong><?php echo $hasReportData ? analyticsFormatNumber($totals['activeUsers']) : '—'; ?></strong><small>Users who engaged with your site or app</small></article>
        <article class="analytics-stat-card"><span>New users</span><strong><?php echo $hasReportData ? analyticsFormatNumber($totals['newUsers']) : '—'; ?></strong><small>First-time users</small></article>
        <article class="analytics-stat-card"><span>Sessions</span><strong><?php echo $hasReportData ? analyticsFormatNumber($totals['sessions']) : '—'; ?></strong><small>Total sessions</small></article>
        <article class="analytics-stat-card"><span>Page views</span><strong><?php echo $hasReportData ? analyticsFormatNumber($totals['screenPageViews']) : '—'; ?></strong><small>Views across pages and screens</small></article>
        <article class="analytics-stat-card"><span>Engagement rate</span><strong><?php echo $hasReportData ? number_format($totals['engagementRate'] * 100, 1) . '%' : '—'; ?></strong><small>Engaged sessions ÷ total sessions</small></article>
      </section>

      <section class="analytics-charts">
        <article class="analytics-panel analytics-trend-panel">
          <div class="analytics-panel-heading"><div><h2>Users &amp; sessions</h2><p>Daily activity during the last 30 days</p></div></div>
          <?php if (count($dailyRows) > 0): ?>
            <div class="analytics-legend"><span><i class="legend-dot dot-blue"></i>Active users</span><span><i class="legend-dot dot-purple"></i>Sessions</span></div>
            <div class="analytics-chart-scroll">
              <svg class="analytics-chart" viewBox="0 0 700 220" role="img" aria-label="Line chart of daily active users and sessions">
                <line x1="8" y1="52" x2="692" y2="52"/><line x1="8" y1="106" x2="692" y2="106"/><line x1="8" y1="160" x2="692" y2="160"/><line x1="8" y1="210" x2="692" y2="210"/>
                <polyline class="chart-line chart-line-users" points="<?php echo ga4Escape(analyticsChartPoints($dailyRows, 'users', 700, 220, $dailyChartMax)); ?>" />
                <polyline class="chart-line chart-line-sessions" points="<?php echo ga4Escape(analyticsChartPoints($dailyRows, 'sessions', 700, 220, $dailyChartMax)); ?>" />
              </svg>
            </div>
            <div class="analytics-date-range"><span><?php echo ga4Escape(date('M j', strtotime($dailyRows[0]['date']))); ?></span><span><?php echo ga4Escape(date('M j', strtotime($dailyRows[count($dailyRows) - 1]['date']))); ?></span></div>
          <?php else: ?>
            <p class="analytics-empty">No daily data is available for this date range.</p>
          <?php endif; ?>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-heading"><div><h2>Top pages</h2><p>By page views</p></div></div>
          <?php if (count($topPages) > 0): ?>
            <ul class="analytics-ranking">
              <?php $pageMax = analyticsMaxValue($topPages); foreach ($topPages as $item): ?>
                <li><div><span><?php echo ga4Escape($item['name'] ?: '(not set)'); ?></span><strong><?php echo analyticsFormatNumber($item['value']); ?></strong></div><i style="width: <?php echo min(100, ($item['value'] / $pageMax) * 100); ?>%"></i></li>
              <?php endforeach; ?>
            </ul>
          <?php else: ?><p class="analytics-empty">No page data available.</p><?php endif; ?>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-heading"><div><h2>Sessions by channel</h2><p>Default channel group</p></div></div>
          <?php if (count($channels) > 0): ?>
            <ul class="analytics-ranking">
              <?php $channelMax = analyticsMaxValue($channels); foreach ($channels as $item): ?>
                <li><div><span><?php echo ga4Escape($item['name'] ?: '(not set)'); ?></span><strong><?php echo analyticsFormatNumber($item['value']); ?></strong></div><i style="width: <?php echo min(100, ($item['value'] / $channelMax) * 100); ?>%"></i></li>
              <?php endforeach; ?>
            </ul>
          <?php else: ?><p class="analytics-empty">No channel data available.</p><?php endif; ?>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-heading"><div><h2>Users by device</h2><p>Device category</p></div></div>
          <?php if (count($devices) > 0): ?>
            <ul class="analytics-ranking">
              <?php $deviceMax = analyticsMaxValue($devices); foreach ($devices as $item): ?>
                <li><div><span><?php echo ga4Escape($item['name']); ?></span><strong><?php echo analyticsFormatNumber($item['value']); ?></strong></div><i style="width: <?php echo min(100, ($item['value'] / $deviceMax) * 100); ?>%"></i></li>
              <?php endforeach; ?>
            </ul>
          <?php else: ?><p class="analytics-empty">No device data available.</p><?php endif; ?>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-heading"><div><h2>Top countries</h2><p>By active users</p></div></div>
          <?php if (count($countries) > 0): ?>
            <ul class="analytics-ranking">
              <?php $countryMax = analyticsMaxValue($countries); foreach ($countries as $item): ?>
                <li><div><span><?php echo ga4Escape($item['name'] ?: '(not set)'); ?></span><strong><?php echo analyticsFormatNumber($item['value']); ?></strong></div><i style="width: <?php echo min(100, ($item['value'] / $countryMax) * 100); ?>%"></i></li>
              <?php endforeach; ?>
            </ul>
          <?php else: ?><p class="analytics-empty">No country data available.</p><?php endif; ?>
        </article>
      </section>
    </main>
  </div>
  <?php include __DIR__ . '/assets/footer.php'; ?>
