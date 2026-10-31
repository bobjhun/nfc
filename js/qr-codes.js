document.addEventListener("DOMContentLoaded", function () {
  initQrPreview();

  var dialog = document.getElementById("qrModal");
  var openButton = document.getElementById("openQrModal");
  var closeButton = document.getElementById("closeQrModal");
  var cancelButton = document.getElementById("cancelQrModal");

  if (!dialog || !openButton) return;

  openButton.addEventListener("click", function () {
    dialog.showModal();
    var nameField = dialog.querySelector('input[name="name"]');
    if (nameField) nameField.focus();
  });

  [closeButton, cancelButton].forEach(function (button) {
    if (button) button.addEventListener("click", function () {
      dialog.close();
    });
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });

  if (dialog.querySelector('[role="alert"]')) dialog.showModal();
});

function initQrPreview() {
  var dialog = document.getElementById("qrViewModal");
  var image = document.getElementById("qrViewImage");
  var title = document.getElementById("qrViewTitle");
  var destination = document.getElementById("qrViewDestination");
  var download = document.getElementById("downloadQrImage");
  var closeButton = document.getElementById("closeQrView");

  if (!dialog || !image || !title || !destination || !download) return;

  document.querySelectorAll(".qr-preview-trigger").forEach(function (button) {
    button.addEventListener("click", function () {
      var name = button.dataset.qrName || "QR Code";
      var link = button.dataset.qrLink || "";
      var imageUrl = button.dataset.qrImage || "";

      title.textContent = name;
      image.src = imageUrl;
      image.alt = "QR code for " + name;
      destination.href = link;
      destination.textContent = link;
      download.href = imageUrl;
      download.download = name.replace(/[^\w.-]+/g, "-") + "-qr-code.png";
      dialog.showModal();
      if (closeButton) closeButton.focus();
    });
  });

  if (closeButton) {
    closeButton.addEventListener("click", function () {
      dialog.close();
    });
  }

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
}
