export const MultipleFileUploader = () => {
  document.querySelectorAll('input[data-provide="multiple_file_uploader"]').forEach(input => {
    const id = input.id;
    const dropZone = document.getElementById(`${id}_dropZone`);
    const selectedFilesContainer = document.getElementById(`${id}_selectedFiles`);
    const btnClear = document.getElementById(`${id}_btn_clear`);
    const trigger = dropZone.querySelector('[data-trigger]');

    let selectedFiles = [];

    // trigger button opens native picker
    trigger && trigger.addEventListener('click', () => input.click());

    // file input change
    input.addEventListener('change', (e) => {
      const newFiles = Array.from(e.target.files || []);
      appendFiles(newFiles);
      render();
    });

    // clear
    btnClear.addEventListener('click', clearFiles);

    // drag & drop
    ['dragenter','dragover'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '#e9ecef';
      });
    });
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = '#f8f9fa';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = '#f8f9fa';
      const files = Array.from(e.dataTransfer.files || []);
      appendFiles(files);
      render();
    });

    function appendFiles(files) {
      if (!files.length) return;
      selectedFiles = [...selectedFiles, ...files];
      if (selectedFiles.length > 10) {
        alert('Maximum of 10 files allowed');
        selectedFiles = selectedFiles.slice(0, 10);
      }
      selectedFiles = selectedFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 5MB`);
          return false;
        }
        return true;
      });
    }

    function render() {
      if (!selectedFiles.length) {
        selectedFilesContainer.innerHTML = '';
        btnClear.style.display = 'none';
        return;
      }

      const totalSize = selectedFiles.reduce((s,f) => s + f.size, 0);
      const totalSizeFormatted = formatBytes(totalSize);

      const cols = selectedFiles.map((file, index) => {
        const nameShort = file.name.length > 10 ? file.name.substring(0,10) + '...' : file.name;
        const isImage = file.type.startsWith('image/');
        let templateHtml = `<i class="fas fa-file" style="font-size: 2.5rem; color: #6c757d;"></i>`;
        if (isImage) {
          const url = URL.createObjectURL(file);
          templateHtml = `<img src="${url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin:0 auto;" onload="URL.revokeObjectURL(this.src)">`;
        }
        return `
          <div class="col mb-3" style="flex: 0 0 calc(100% / 7);">
            <div class="border rounded p-2 d-flex flex-column text-center" style="height: 160px;">
              <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                ${templateHtml}
                <div class="small text-truncate mt-1 w-100" title="${file.name}">${nameShort}</div>
                <div class="small text-muted">${formatBytes(file.size)}</div>
              </div>
              <div class="mt-auto w-100">
                <button type="button" class="btn btn-sm btn-outline-danger w-100" data-remove-index="${index}" style="font-size:0.75rem;">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      selectedFilesContainer.innerHTML = `
        <div class="text-start mt-3">
          <p class="mb-2"><strong>Selected:</strong> ${selectedFiles.length} - ${totalSizeFormatted}</p>
          <div class="row">${cols}</div>
        </div>
      `;
      btnClear.style.display = 'block';

      // attach remove listeners
      selectedFilesContainer.querySelectorAll('[data-remove-index]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-remove-index'), 10);
          removeFile(idx);
        });
      });
    }

    function removeFile(index) {
      selectedFiles.splice(index, 1);
      render();
    }

    function clearFiles() {
      selectedFiles = [];
      render();
    }

    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes','KB','MB','GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  });
};
