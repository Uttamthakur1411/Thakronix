(() => {
  const downloadButton = document.getElementById('mediaDownload');
  if (!downloadButton) return;

  const isVisible = (element) => element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== 'hidden';

  downloadButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const status = document.getElementById('mediaActionStatus');
    if (status) {
      status.textContent = '';
      status.classList.remove('show');
    }

    const downloadTarget = [...document.querySelectorAll('a[download], a[id], button[id], button[aria-label]')]
      .find((element) => element !== downloadButton && !element.disabled && isVisible(element) &&
        /download|export/i.test(`${element.id} ${element.textContent} ${element.getAttribute('aria-label') || ''}`));

    if (downloadTarget) {
      downloadTarget.click();
      return;
    }

    const textOutput = document.querySelector('textarea#output, input#output');
    if (textOutput?.value.trim()) {
      const blobUrl = URL.createObjectURL(new Blob([textOutput.value], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${document.title.replace(/\s*[|·].*$/, '').trim() || 'Thakronix'}-result.txt`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      return;
    }

    if (status) {
      status.textContent = 'Create a result before downloading.';
      status.classList.add('show');
    }
  }, true);
})();