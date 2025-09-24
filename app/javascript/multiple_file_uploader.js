// Multiple File Uploader (vanilla JS + Bootstrap styles)
// Features:
//  - Click trigger
//  - Drag & drop
//  - Preview list with thumbnail (images) or icon
//  - Remove single / clear all
//  - Enforces max files & max file size (config via data attributes)

(function() {
	const SELECTOR_WRAPPER = '[data-provide="multiple-file-uploader"]';

	function formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function initWrapper(wrapper) {
		if (wrapper.__initialized) return; // idempotent
		wrapper.__initialized = true;

		const fileInput = wrapper.querySelector('input[type="file"]');
		if (!fileInput) return;

		const previews = wrapper.querySelector('[data-multiple-file-uploader-target="previews"]');
		const clearBtn = wrapper.querySelector('[data-action="multiple-file-uploader#clear"]');

		const limitFiles = parseInt(wrapper.getAttribute('data-limit-files') || '10', 10);
		const maxFileSizeMB = parseInt(wrapper.getAttribute('data-max-file-size-mb') || '5', 10);
		const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

		let selectedFiles = [];

		function updateUI() {
			if (!previews) return;
			if (selectedFiles.length === 0) {
				previews.innerHTML = '';
				if (clearBtn) clearBtn.style.display = 'none';
				return;
			}
			if (clearBtn) clearBtn.style.display = 'inline-block';
			const totalSize = selectedFiles.reduce((s, f) => s + f.size, 0);
			const gridItems = selectedFiles.map((file, index) => {
				const isImage = file.type.startsWith('image/');
				let previewPart;
				if (isImage) {
					const url = URL.createObjectURL(file);
						// revoke later
					previewPart = `<img src="${url}" class="rounded mb-1" style="width:40px;height:40px;object-fit:cover;" data-temp-url>`;
				} else {
					previewPart = '<i class="fas fa-file" style="font-size:2rem;color:#6c757d;"></i>';
				}
				const shortName = file.name.length > 14 ? file.name.slice(0, 11) + '…' : file.name;
				return `
					<div class="col mb-3" style="flex:0 0 calc(100% / 7);">
						<div class="border rounded p-2 d-flex flex-column text-center" style="height:160px;">
							<div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
								${previewPart}
								<div class="small text-truncate mt-1 w-100" title="${file.name}">${shortName}</div>
								<div class="small text-muted">${formatBytes(file.size)}</div>
							</div>
							<div class="mt-auto w-100">
								<button type="button" class="btn btn-sm btn-outline-danger w-100" data-remove-index="${index}" style="font-size:0.7rem;">Remover</button>
							</div>
						</div>
					</div>`;
			}).join('');

			previews.innerHTML = `
				<div class="mt-3">
					<p class="mb-2"><strong>Selecionados:</strong> ${selectedFiles.length} - ${formatBytes(totalSize)}</p>
					<div class="row">${gridItems}</div>
				</div>`;

			// revoke object URLs now that nodes are in DOM (images will load soon)
			previews.querySelectorAll('img[data-temp-url]').forEach(img => {
				img.addEventListener('load', () => URL.revokeObjectURL(img.src), { once: true });
			});
		}

		function addFiles(fileList) {
			const incoming = Array.from(fileList);
			let merged = selectedFiles.concat(incoming);
			if (merged.length > limitFiles) {
				alert(`Máximo de ${limitFiles} arquivos permitido.`);
				merged = merged.slice(0, limitFiles);
			}
			merged = merged.filter(f => {
				if (f.size > maxFileSizeBytes) {
					alert(`Arquivo ${f.name} excede ${maxFileSizeMB}MB.`);
					return false;
				}
				return true;
			});
			selectedFiles = merged;
			// We need to reflect the chosen files in the hidden input. Create a DataTransfer.
			const dt = new DataTransfer();
			selectedFiles.forEach(f => dt.items.add(f));
			fileInput.files = dt.files;
			updateUI();
		}

		fileInput.addEventListener('change', (e) => {
			addFiles(e.target.files);
			fileInput.value = ''; // allow re-adding same file name
		});

		if (clearBtn) {
			clearBtn.addEventListener('click', () => {
				selectedFiles = [];
				const dt = new DataTransfer();
				fileInput.files = dt.files;
				updateUI();
			});
		}

		if (previews) {
			previews.addEventListener('click', (e) => {
				const btn = e.target.closest('[data-remove-index]');
				if (!btn) return;
				const index = parseInt(btn.getAttribute('data-remove-index'), 10);
				selectedFiles.splice(index, 1);
				const dt = new DataTransfer();
				selectedFiles.forEach(f => dt.items.add(f));
				fileInput.files = dt.files;
				updateUI();
			});
		}

		// Drag & drop events bound to border-dashed container only (the parent of previews & icon)
		const dropZone = wrapper.querySelector('.border-dashed');
		const dropArea = dropZone || wrapper.querySelector('[data-action*="drop->"]') || wrapper;

		function highlight(on) {
			if (!dropArea) return;
			dropArea.classList.toggle('bg-secondary-subtle', on);
		}

		['dragenter', 'dragover'].forEach(ev => {
			dropArea.addEventListener(ev, e => {
				e.preventDefault();
				e.stopPropagation();
				highlight(true);
			});
		});
		['dragleave', 'dragend'].forEach(ev => {
			dropArea.addEventListener(ev, e => {
				e.preventDefault();
				e.stopPropagation();
				highlight(false);
			});
		});
		dropArea.addEventListener('drop', e => {
			e.preventDefault();
			e.stopPropagation();
			highlight(false);
			if (e.dataTransfer?.files?.length) {
				addFiles(e.dataTransfer.files);
			}
		});

		// Public trigger button(s)
		wrapper.querySelectorAll('[data-action="click->multiple-file-uploader#trigger"]').forEach(btn => {
			btn.addEventListener('click', () => fileInput.click());
		});
	}

	function initAll() {
		document.querySelectorAll(SELECTOR_WRAPPER).forEach(initWrapper);
	}

	document.addEventListener('turbo:load', initAll); // Turbo support
	document.addEventListener('DOMContentLoaded', initAll); // Fallback
})();

