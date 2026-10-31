<?php
$pageTitle = "Here's what's happening with your social media.";
$pageDescription = 'Track performance, manage your content, and keep your brand moving forward.';
$activePage = 'dashboard';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ascend Media Works — Dashboard</title>
  <meta name="description" content="Ascend Media Works social media management dashboard" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <div class="app">

    <?php include __DIR__ . '/assets/sidebar.php'; ?>
    <!-- ===================== Main ===================== -->
    <main class="main">
      <?php
      include __DIR__ . '/assets/topbar.php';
      ?>

      <!-- Stat cards -->
      <section class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Total Followers</span>
            <span class="stat-value">24,892</span>
            <span class="stat-change"><span class="arrow-up">↑</span> 12.5%</span>
            <span class="stat-period">vs. last 30 days</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-purple">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Total Engagement</span>
            <span class="stat-value">8,734</span>
            <span class="stat-change"><span class="arrow-up">↑</span> 18.3%</span>
            <span class="stat-period">vs. last 30 days</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Reach</span>
            <span class="stat-value">142,621</span>
            <span class="stat-change"><span class="arrow-up">↑</span> 26.7%</span>
            <span class="stat-period">vs. last 30 days</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-orange">
            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="12" width="3" height="8" rx="1"/><rect x="10.5" y="8" width="3" height="12" rx="1"/><rect x="17" y="4" width="3" height="16" rx="1"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-label">Link Clicks</span>
            <span class="stat-value">5,298</span>
            <span class="stat-change"><span class="arrow-up">↑</span> 34.2%</span>
            <span class="stat-period">vs. last 30 days</span>
          </div>
        </div>
      </section>

      <!-- Charts row -->
      <section class="charts-row">
        <div class="chart-card">
          <div class="chart-card-head">
            <div class="chart-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>
              <h2>Performance Overview</h2>
            </div>
            <div class="select-wrap">
              <select id="rangeSelect" aria-label="Date range">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 90 Days</option>
              </select>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="legend-dot dot-blue"></span>Reach</span>
            <span class="legend-item"><span class="legend-dot dot-purple"></span>Engagement</span>
            <span class="legend-item"><span class="legend-dot dot-green"></span>Link Clicks</span>
          </div>

          <div class="chart-area">
            <div class="chart-ylabels">
              <span>40K</span><span>30K</span><span>20K</span><span>10K</span><span>0</span>
            </div>
            <div class="chart-plot">
              <svg viewBox="0 0 600 240" preserveAspectRatio="none" class="chart-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2563eb" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <g class="gridlines">
                  <line x1="0" y1="0" x2="600" y2="0"/>
                  <line x1="0" y1="60" x2="600" y2="60"/>
                  <line x1="0" y1="120" x2="600" y2="120"/>
                  <line x1="0" y1="180" x2="600" y2="180"/>
                  <line x1="0" y1="240" x2="600" y2="240"/>
                </g>
                <!-- Reach (blue) -->
                <path class="line-fill" fill="url(#fillBlue)" d="M0,165 C25,140 45,120 70,128 C95,136 110,170 135,168 C160,166 170,118 195,110 C220,102 235,138 260,142 C285,146 300,110 325,92 C350,74 365,86 385,74 C405,62 415,40 440,38 C465,36 480,70 500,72 C520,74 535,60 560,52 C580,46 590,44 600,38 L600,240 L0,240 Z"/>
                <path class="line-stroke stroke-blue" d="M0,165 C25,140 45,120 70,128 C95,136 110,170 135,168 C160,166 170,118 195,110 C220,102 235,138 260,142 C285,146 300,110 325,92 C350,74 365,86 385,74 C405,62 415,40 440,38 C465,36 480,70 500,72 C520,74 535,60 560,52 C580,46 590,44 600,38"/>
                <!-- Engagement (purple) -->
                <path class="line-stroke stroke-purple" d="M0,180 C30,168 50,150 75,152 C100,154 115,176 140,172 C165,168 180,132 205,126 C230,120 245,146 270,148 C295,150 310,120 335,106 C360,92 375,102 395,92 C415,82 430,66 455,64 C480,62 495,92 515,94 C535,96 550,84 575,76 C590,71 595,70 600,66"/>
                <!-- Link clicks (green) -->
                <path class="line-stroke stroke-green" d="M0,196 C30,190 55,180 80,182 C105,184 120,196 145,192 C170,188 185,168 210,164 C235,160 250,176 275,178 C300,180 315,160 340,148 C365,136 380,146 400,138 C420,130 435,118 460,116 C485,114 500,140 520,142 C540,144 555,132 580,124 C590,121 595,120 600,118"/>
              </svg>
              <div class="chart-xlabels">
                <span>Sep 23</span><span>Sep 27</span><span>Oct 1</span><span>Oct 5</span><span>Oct 9</span><span>Oct 13</span><span>Oct 17</span><span>Oct 21</span><span>Oct 23</span>
              </div>
            </div>
          </div>
        </div>

        <div class="platform-card">
          <h2>Top Performing Platform</h2>
          <ul class="platform-list">
            <li class="platform-row">
              <span class="platform-logo logo-facebook">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.2v7z"/></svg>
              </span>
              <div class="platform-info">
                <span class="platform-name">Facebook</span>
                <span class="platform-meta">42,531 reach</span>
                <span class="platform-sub">3.8% engagement</span>
              </div>
              <span class="platform-change"><span class="arrow-up">↑</span> 28%</span>
            </li>
            <li class="platform-row">
              <span class="platform-logo logo-instagram">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.8.1-1.1.1-1.5.2-1.9.3-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.1.4-.3.8-.3 1.9-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1.1.2 1.5.3 1.9.2.5.4.8.7 1.1.3.3.6.5 1.1.7.4.1.8.3 1.9.3 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1.1-.1 1.5-.2 1.9-.3.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.1-.4.3-.8.3-1.9.1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1.1-.2-1.5-.3-1.9-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.4-.1-.8-.3-1.9-.3-1.3-.1-1.7-.1-4.8-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.2-8.3a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z"/></svg>
              </span>
              <div class="platform-info">
                <span class="platform-name">Instagram</span>
                <span class="platform-meta">38,204 reach</span>
                <span class="platform-sub">5.2% engagement</span>
              </div>
              <span class="platform-change"><span class="arrow-up">↑</span> 34%</span>
            </li>
            <li class="platform-row">
              <span class="platform-logo logo-tiktok">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2 1.7 3.4 3.9 3.6v2.8c-1.5 0-2.8-.4-3.9-1.2v5.9c0 4.2-3.4 6.5-6.6 5.7-2.6-.6-4.4-3-4.1-5.7.3-3 2.9-5.1 5.9-4.8v2.9c-1.4-.4-2.8.5-3 1.9-.2 1.3.7 2.5 2 2.7 1.4.2 2.7-.9 2.7-2.4V3h3.1z"/></svg>
              </span>
              <div class="platform-info">
                <span class="platform-name">TikTok</span>
                <span class="platform-meta">27,689 reach</span>
                <span class="platform-sub">6.7% engagement</span>
              </div>
              <span class="platform-change"><span class="arrow-up">↑</span> 41%</span>
            </li>
            <li class="platform-row">
              <span class="platform-logo logo-linkedin">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-7.9c0-1.88-.03-4.3-2.62-4.3-2.63 0-3.03 2.05-3.03 4.17V23H8V8z" transform="translate(2 0) scale(0.85)"/></svg>
              </span>
              <div class="platform-info">
                <span class="platform-name">LinkedIn</span>
                <span class="platform-meta">12,492 reach</span>
                <span class="platform-sub">4.1% engagement</span>
              </div>
              <span class="platform-change"><span class="arrow-up">↑</span> 19%</span>
            </li>
          </ul>
        </div>
      </section>
    </main>

    <!-- ===================== Right rail ===================== -->
    <aside class="right-rail">
      <div class="promo-card">
        <div class="promo-bg"></div>
        <div class="promo-overlay">
          <h3>Social Media Makes<br>Big Things Happen</h3>
          <p>Plan&nbsp;&nbsp;·&nbsp;&nbsp;Create&nbsp;&nbsp;·&nbsp;&nbsp;Engage&nbsp;&nbsp;·&nbsp;&nbsp;Grow</p>
        </div>
      </div>

      <button class="create-post-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Create New Post
      </button>

      <div class="quick-grid">
        <button class="quick-btn" type="button">
          <span class="quick-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>
          Schedule Post
        </button>
        <button class="quick-btn" type="button">
          <span class="quick-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          </span>
          Upload Media
        </button>
        <button class="quick-btn" type="button">
          <span class="quick-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>
          View Calendar
        </button>
        <button class="quick-btn" type="button">
          <span class="quick-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/></svg>
          </span>
          Check Analytics
        </button>
      </div>

      <div class="activity-card">
        <div class="activity-head">
          <div class="activity-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <h3>Recent Activity</h3>
          </div>
          <a href="#" class="view-all">View All</a>
        </div>
        <ul class="activity-list">
          <li class="activity-row">
            <span class="activity-logo logo-instagram small">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.9a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.2-8.3a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z"/></svg>
            </span>
            <div class="activity-info">
              <span class="activity-text">Your post on Instagram got 1.2K likes</span>
              <span class="activity-time">2 hours ago</span>
            </div>
          </li>
          <li class="activity-row">
            <span class="activity-logo logo-facebook small">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.2v7z"/></svg>
            </span>
            <div class="activity-info">
              <span class="activity-text">New comment on Facebook</span>
              <span class="activity-quote">"Great content! Keep it up!"</span>
              <span class="activity-time">4 hours ago</span>
            </div>
          </li>
          <li class="activity-row">
            <span class="activity-logo logo-megaphone small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-7-4 16-6-4-3 3v-5z"/></svg>
            </span>
            <div class="activity-info">
              <span class="activity-text">Ad campaign "Brand Awareness" is now live</span>
              <span class="activity-time">6 hours ago</span>
            </div>
          </li>
          <li class="activity-row">
            <span class="activity-logo logo-tiktok small">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2 1.7 3.4 3.9 3.6v2.8c-1.5 0-2.8-.4-3.9-1.2v5.9c0 4.2-3.4 6.5-6.6 5.7-2.6-.6-4.4-3-4.1-5.7.3-3 2.9-5.1 5.9-4.8v2.9c-1.4-.4-2.8.5-3 1.9-.2 1.3.7 2.5 2 2.7 1.4.2 2.7-.9 2.7-2.4V3h3.1z"/></svg>
            </span>
            <div class="activity-info">
              <span class="activity-text">New follower on TikTok</span>
              <span class="activity-quote">@user123 joined your account</span>
              <span class="activity-time">8 hours ago</span>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  </div>

  <?php include __DIR__ . '/assets/footer.php'; ?>
