/* ============================================
   Ascend Media Works — Dashboard scripts
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  initDateLabel();
  initRangeSelect();
  initNotifications();
  initQuickButtons();
});

/* Show today's date in the header date picker */
function initDateLabel() {
  var label = document.getElementById("dateLabel");
  if (!label) return;

  var now = new Date();
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var formatted = months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
  label.textContent = formatted;
}

/* Update the chart heading when the range changes */
function initRangeSelect() {
  var select = document.getElementById("rangeSelect");
  if (!select) return;

  select.addEventListener("change", function () {
    var range = select.value;
    // Demo: show a range-specific summary under the chart legend.
    var legend = document.querySelector(".chart-legend");
    if (legend) {
      legend.setAttribute("data-range", range);
    }
    console.log("Chart range changed to: " + range);
  });
}

/* Simple feedback on the notification bell */
function initNotifications() {
  var btn = document.getElementById("notifBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var dot = btn.querySelector(".notif-dot");
    if (dot) {
      dot.style.display = "none";
    }
    btn.setAttribute("aria-label", "No new notifications");
    console.log("Notifications marked as read");
  });
}

/* Placeholder handlers for the quick action buttons */
function initQuickButtons() {
  var buttons = document.querySelectorAll(".create-post-btn, .quick-btn, .view-all");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var text = btn.textContent.trim().replace(/\s+/g, " ");
      console.log('"' + text + '" clicked — hook up your own navigation here.');
    });
  });
}
