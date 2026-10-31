<footer class="site-footer">
  <span>© <?php echo date('Y'); ?> Ascend Media Works</span>
  <span>CREATE · CONNECT · GROW</span>
</footer>
<script src="js/script.js"></script>
<?php if (!empty($pageScript)): ?>
<script src="<?php echo htmlspecialchars($pageScript, ENT_QUOTES, 'UTF-8'); ?>"></script>
<?php endif; ?>
</body>
</html>
