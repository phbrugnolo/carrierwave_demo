// Multiple File Uploader (vanilla JS + Bootstrap styles)
// Now refactored into an ES module exporting a class.
// Usage:
//   import { MultipleFileUploader } from "./multiple_file_uploader";
//   MultipleFileUploader.autoDiscover(); // or manually: new MultipleFileUploader(element)

export class MultipleFileUploader {
  static SELECTOR = '[data-provide="multiple-file-uploader"]';

  static autoDiscover() {
    document.querySelectorAll(MultipleFileUploader.SELECTOR).forEach(el => {
      if (!el.__mfu) el.__mfu = new MultipleFileUploader(el);
    });
  }

  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  constructor(wrapper) {
    this.wrapper = wrapper;
    if (this.wrapper.__initialized) return; // idempotent guard
    this.wrapper.__initialized = true;

    this.fileInput = this.wrapper.querySelector('input[type="file"]');
    if (!this.fileInput) return;

    this.previews = this.wrapper.querySelector('[data-multiple-file-uploader-target="previews"]');
    this.clearBtn = this.wrapper.querySelector('[data-action="multiple-file-uploader#clear"]');
    this.limitFiles = parseInt(this.wrapper.getAttribute('data-limit-files') || '10', 10);
    this.maxFileSizeMB = parseInt(this.wrapper.getAttribute('data-max-file-size-mb') || '5', 10);
    this.maxFileSizeBytes = this.maxFileSizeMB * 1024 * 1024;
    this.selectedFiles = [];

    this.bindEvents();
  }

  bindEvents() {
    this.fileInput.addEventListener('change', (e) => {
      this.addFiles(e.target.files);
      this.fileInput.value = '';
    });

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }

    if (this.previews) {
      this.previews.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-index]');
        if (!btn) return;
        const index = parseInt(btn.getAttribute('data-remove-index'), 10);
        this.removeAt(index);
      });
    }

    // Drag & drop
    const dropZone = this.wrapper.querySelector('.border-dashed');
    this.dropArea = dropZone || this.wrapper.querySelector('[data-action*="drop->"]') || this.wrapper;
    ['dragenter', 'dragover'].forEach(ev => {
      this.dropArea.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        this.highlight(true);
      });
    });
    ['dragleave', 'dragend'].forEach(ev => {
      this.dropArea.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        this.highlight(false);
      });
    });
    this.dropArea.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      this.highlight(false);
      if (e.dataTransfer?.files?.length) {
        this.addFiles(e.dataTransfer.files);
      }
    });

    // Trigger buttons
    this.wrapper.querySelectorAll('[data-action="click->multiple-file-uploader#trigger"]').forEach(btn => {
      btn.addEventListener('click', () => this.fileInput.click());
    });
  }

  highlight(on) {
    if (!this.dropArea) return;
    this.dropArea.classList.toggle('bg-secondary-subtle', on);
  }

  addFiles(fileList) {
    const incoming = Array.from(fileList);
    let merged = this.selectedFiles.concat(incoming);
    if (merged.length > this.limitFiles) {
      alert(`Máximo de ${this.limitFiles} arquivos permitido.`);
      merged = merged.slice(0, this.limitFiles);
    }
    merged = merged.filter(f => {
      if (f.size > this.maxFileSizeBytes) {
        alert(`Arquivo ${f.name} excede ${this.maxFileSizeMB}MB.`);
        return false;
      }
      return true;
    });
    this.selectedFiles = merged;
    this.syncNativeInput();
    this.render();
  }

  removeAt(index) {
    this.selectedFiles.splice(index, 1);
    this.syncNativeInput();
    this.render();
  }

  clear() {
    this.selectedFiles = [];
    this.syncNativeInput();
    this.render();
  }

  syncNativeInput() {
    const dt = new DataTransfer();
    this.selectedFiles.forEach(f => dt.items.add(f));
    this.fileInput.files = dt.files;
  }

  render() {
    if (!this.previews) return;
    if (this.selectedFiles.length === 0) {
      this.previews.innerHTML = '';
      if (this.clearBtn) this.clearBtn.style.display = 'none';
      return;
    }
    if (this.clearBtn) this.clearBtn.style.display = 'inline-block';
    const totalSize = this.selectedFiles.reduce((s, f) => s + f.size, 0);
    const gridItems = this.selectedFiles.map((file, index) => {
      const isImage = file.type.startsWith('image/');
      let previewPart;
      if (isImage) {
        const url = URL.createObjectURL(file);
        previewPart = `<img src="${url}" class="rounded mb-1" style="width:40px;height:40px;object-fit:cover;" data-temp-url>`;
      } else {
        previewPart = '<i class="fas fa-file" style="font-size:2rem;color:#6c757d;"></i>';
      }
      const shortName = file.name.length > 14 ? file.name.slice(0, 11) + '…' : file.name;
      return `
        <div class="col mb-3" style="flex:0 0 calc(100% / 7);">\n          <div class="border rounded p-2 d-flex flex-column text-center" style="height:160px;">\n            <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">\n              ${previewPart}\n              <div class="small text-truncate mt-1 w-100" title="${file.name}">${shortName}</div>\n              <div class="small text-muted">${MultipleFileUploader.formatBytes(file.size)}</div>\n            </div>\n            <div class="mt-auto w-100">\n              <button type=\"button\" class=\"btn btn-sm btn-outline-danger w-100\" data-remove-index=\"${index}\" style=\"font-size:0.7rem;\">Remover</button>\n            </div>\n          </div>\n        </div>`;
    }).join('');

    this.previews.innerHTML = `
      <div class="mt-3">
        <p class="mb-2"><strong>Selecionados:</strong> ${this.selectedFiles.length} - ${MultipleFileUploader.formatBytes(totalSize)}</p>
        <div class="row">${gridItems}</div>
      </div>`;

    this.previews.querySelectorAll('img[data-temp-url]').forEach(img => {
      img.addEventListener('load', () => URL.revokeObjectURL(img.src), { once: true });
    });
  }
}

// Auto-init (keeps previous behavior) when using standard pack import
// function autoInit() { MultipleFileUploader.autoDiscover(); }
// document.addEventListener('turbo:load', autoInit);
// document.addEventListener('DOMContentLoaded', autoInit);


