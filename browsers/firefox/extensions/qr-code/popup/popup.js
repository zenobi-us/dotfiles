// QR Code Popup Script
(function() {
  'use strict';

  const qrcodeContainer = document.getElementById('qrcode');
  const urlText = document.getElementById('url');
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const toast = document.getElementById('toast');

  let currentUrl = '';

  // Get current tab URL and generate QR code
  async function init() {
    qrcodeContainer.classList.add('loading');
    
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (tab && tab.url) {
        currentUrl = tab.url;
        generateQRCode(currentUrl);
        urlText.textContent = truncateUrl(currentUrl, 40);
        urlText.title = currentUrl;
      } else {
        showError('Unable to get page URL');
      }
    } catch (error) {
      console.error('Error getting tab:', error);
      showError('Error: ' + error.message);
    }
  }

  // Generate QR code using qrcode-generator library
  function generateQRCode(text) {
    qrcodeContainer.classList.remove('loading');
    qrcodeContainer.innerHTML = '';

    try {
      // qrcode-generator: type number 0 = auto-detect, error correction L
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();

      // Create canvas for high-quality rendering
      const moduleCount = qr.getModuleCount();
      const cellSize = 6;
      const margin = 2;
      const size = (moduleCount + margin * 2) * cellSize;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.id = 'qr-canvas';

      const ctx = canvas.getContext('2d');
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Draw QR modules
      ctx.fillStyle = '#1a1a2e';
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(
              (col + margin) * cellSize,
              (row + margin) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }

      qrcodeContainer.appendChild(canvas);
    } catch (error) {
      console.error('QR generation error:', error);
      showError('Failed to generate QR code');
    }
  }

  // Show error message
  function showError(message) {
    qrcodeContainer.classList.remove('loading');
    qrcodeContainer.innerHTML = `<span style="color: #ff6b6b; font-size: 12px;">${message}</span>`;
  }

  // Truncate URL for display
  function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }

  // Show toast notification
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  // Copy URL to clipboard
  copyBtn.addEventListener('click', async () => {
    if (!currentUrl) return;
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      showToast('URL copied!');
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = currentUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('URL copied!');
    }
  });

  // Download QR code as PNG
  downloadBtn.addEventListener('click', () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Downloaded!');
  });

  // Initialize on load
  init();
})();
