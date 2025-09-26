export const MultipleFileUploader = () => {
  document.querySelectorAll('input[data-provide="multiple_file_uploader"]').forEach(input => {
    const id = input.id;
    const dropZone = document.getElementById(`${id}_dropZone`);
    const selectedFilesContainer = document.getElementById(`${id}_selectedFiles`);
    const btnClear = document.getElementById(`${id}_btn_clear`);
    const trigger = dropZone.querySelector('[data-trigger]');

    let selectedFiles = [];


    const existingMetaRaw = dropZone?.dataset?.existingFiles;
    if (existingMetaRaw) {
      try {
        const metaArr = JSON.parse(existingMetaRaw);
        // Guardamos num formato interno simples
        selectedFiles = metaArr.map(m => ({
          name: m.name || 'arquivo',
            // tamanhos podem ser nulos
          size: m.size || 0,
          type: m.content_type || 'application/octet-stream',
          _existing: true, // flag para diferenciar
          _url: m.url
        }));
      } catch (err) {
        console.warn('Invalid existing files JSON', err);
      }
    }

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
      // 1. Filtra novos arquivos cujo nome (incluindo extensão) já existe em selectedFiles
      const existingNames = new Set(selectedFiles.map(f => f.name.toLowerCase()));
      const uniqueNew = [];
      const duplicates = [];

      files.forEach(f => {
        const key = f.name.toLowerCase();
        if (existingNames.has(key)) {
          duplicates.push(f.name);
        } else {
          existingNames.add(key);
          uniqueNew.push(f);
        }
      });

      if (duplicates.length) {
        // Mensagem em PT-BR para o usuário (ajuste se quiser i18n)
        alert(`Arquivos ignorados (nome duplicado):\n- ${duplicates.join('\n- ')}`);
      }

      selectedFiles = [...selectedFiles, ...uniqueNew];
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
          if (file._existing && file._url) {
            templateHtml = `<img src="${file._url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin:0 auto;">`;
          } else {
            const url = URL.createObjectURL(file);
            templateHtml = `<img src="${url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin:0 auto;" onload="URL.revokeObjectURL(this.src)">`;
          }
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
          ${selectedFiles.some(f => f._existing) ? '<div class="small text-muted mt-1">Arquivos marcados como existentes não serão re-enviados a menos que você adicione novos ou remova/alterar.</div>' : ''}
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
      const file = selectedFiles[index];
      if (!file) return;
      if (file._existing) {
        const form = input.form;
        if (form) {
          const normalizedName = file.name;
          const selector = `input[type="hidden"][name="document[remove_existing][]"][value="${CSS.escape(normalizedName)}"]`;
          const already = form.querySelector(selector);
          if (!already) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'document[remove_existing][]';
            hidden.value = normalizedName;
            form.appendChild(hidden);
          }
        }
      }
      selectedFiles.splice(index, 1);
      render();
    }

    function clearFiles() {
      if (!selectedFiles.length) return;
      const hadExisting = selectedFiles.some(f => f._existing);
      const form = input.form;
      if (hadExisting && form) {
        let hidden = form.querySelector('input[type="hidden"][name="document[remove_all_files]"]');
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'document[remove_all_files]';
          hidden.value = '1';
          form.appendChild(hidden);
        }
      }
      input.value = '';
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
    // Render inicial se já havia arquivos
    render();
  });
};
