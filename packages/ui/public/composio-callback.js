(function() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('composio_success')) {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'composio-auth-complete' }, '*');
    }
    setTimeout(() => {
      window.close();
      if (!window.closed) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;"><div style="text-align:center;"><h2 style="color:#10b981;margin-bottom:1rem;">✓ Connected!</h2><p style="color:#6b7280;">You can close this window</p></div></div>';
      }
    }, 500);
  }
})();
