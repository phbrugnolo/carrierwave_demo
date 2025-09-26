import Toast from "bootstrap/js/dist/toast";

export const MultipleFileUploader = () => {
  const inputs = document.querySelectorAll('input[data-provide="multiple_file_uploader"]');
  if (!inputs.length) return;

  // Toast helpers
  function ensureToastContainer() {
    let c = document.getElementById("fileUploaderToasts");
    if (!c) {
      c = document.createElement("div");
      c.id = "fileUploaderToasts";
      c.className = "toast-container position-fixed bottom-0 end-0 p-3";
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, { variant = "info", autohide = true, delay = 5000 } = {}) {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast align-items-center border-0 text-bg-${variant}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.dataset.bsAutohide = autohide ? "true" : "false";
    toast.dataset.bsDelay = String(delay);

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toast);
    new Toast(toast).show();

    toast.addEventListener("hidden.bs.toast", () => {
      toast.remove();
    });
  }

  inputs.forEach(input => {
    const id = input.id;
    const dropZone = document.getElementById(`${id}_dropZone`);
    const selectedFilesContainer = document.getElementById(`${id}_selectedFiles`);
    const btnClear = document.getElementById(`${id}_btn_clear`);
    const statusRegion = document.getElementById(`${id}_status`);

    if (!dropZone || !selectedFilesContainer || !btnClear) return;

    let config = {};
    try {
      const raw = dropZone.dataset.uploaderConfig;
      if (raw) config = JSON.parse(raw);
    } catch (e) {
      console.warn("Invalid uploader config JSON", e);
    }

    const {
      existing_files: existingFilesMeta = [],
      max_files = 10,
      max_file_mb = 5,
      remove_existing_param,
      remove_all_param,
      texts = {}
    } = config;

    const defaultTexts = {
      selected_label: "Selected",
      existing_note: "Existing files will remain unless removed.",
      duplicate_warning: "Some files were ignored because they have duplicate names:",
      too_many_files: "Maximum of %{max} files allowed.",
      file_too_large: "File %{name} exceeds %{limit} MB.",
      remove_all_btn: "Clear All"
    };
    const t = { ...defaultTexts, ...texts };

    function clearStatus() {
      if (!statusRegion) return;
      statusRegion.textContent = "";
      statusRegion.classList.add("visually-hidden");
    }

    function safeURL(url) {
      if (!url) return null;
      try {
        const u = new URL(url, window.location.origin);
        if (["http:", "https:"].includes(u.protocol)) return u.href;
      } catch (_) { }
      return null;
    }

    let selectedFiles = existingFilesMeta.map(m => ({
      name: (m.name && m.name.length > 0) ? m.name : "file",
      size: m.size || 0,
      type: m.content_type || "application/octet-stream",
      _existing: true,
      _url: safeURL(m.url)
    }));

    const objectUrls = new Set();

    function revokeAllObjectUrls() {
      objectUrls.forEach(u => URL.revokeObjectURL(u));
      objectUrls.clear();
    }

    function syncNativeInput() {
      const dt = new DataTransfer();
      selectedFiles.forEach(f => {
        if (!f._existing) dt.items.add(f);
      });
      input.files = dt.files;
    }

    dropZone.addEventListener("keydown", e => {
      if ((e.key === "Enter" || e.key === " ") && e.target === dropZone) {
        e.preventDefault();
        input.click();
      }
    });

    const explicitTrigger = dropZone.querySelector("[data-trigger]");
    if (explicitTrigger) {
      explicitTrigger.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        input.click();
      });
    }
    dropZone.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      if (e.target.closest(".file-card")) return;
      if (e.currentTarget === dropZone) input.click();
    });

    input.addEventListener("change", e => {
      const files = Array.from(e.target.files || []);
      appendFiles(files);
      render();
    });

    btnClear.addEventListener("click", e => {
      e.stopPropagation();
      clearAllFiles();
    });

    ["dragenter", "dragover"].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        e.preventDefault();
        dropZone.style.backgroundColor = "#e9ecef";
      });
    });
    ["dragleave", "drop"].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        e.preventDefault();
        if (evt === "drop") {
          const files = Array.from(e.dataTransfer.files || []);
          appendFiles(files);
          render();
        }
        dropZone.style.backgroundColor = "#f8f9fa";
      });
    });

    function appendFiles(files) {
      if (!files.length) return;
      clearStatus();

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
        const msg = `${t.duplicate_warning} ${duplicates.join(", ")}`;
        showToast(msg, { variant: "warning" });
      }

      const projected = selectedFiles.length + uniqueNew.length;
      if (projected > max_files) {
        const allowed = max_files - selectedFiles.length;
        const msg = t.too_many_files.replace("%{max}", max_files);
        showToast(msg, { variant: "danger" });
        if (allowed <= 0) {
          return;
        } else {
          uniqueNew.splice(allowed);
        }
      }

      const maxBytes = max_file_mb * 1024 * 1024;
      const filtered = [];
      uniqueNew.forEach(f => {
        if (f.size > maxBytes) {
          const msg = t.file_too_large.replace("%{name}", f.name).replace("%{limit}", max_file_mb);
          showToast(msg, { variant: "danger" });
        } else {
          filtered.push(f);
        }
      });

      selectedFiles = [...selectedFiles, ...filtered];
      syncNativeInput();
    }

    function removeFile(index) {
      const file = selectedFiles[index];
      if (!file) return;
      if (file._existing && remove_existing_param) {
        const form = input.form;
        if (form) {
          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = remove_existing_param;
          hidden.value = file.name;
          form.appendChild(hidden);
        }
      }
      selectedFiles.splice(index, 1);
      syncNativeInput();
      render();
    }

    function clearAllFiles() {
      if (!selectedFiles.length) return;
      const hadExisting = selectedFiles.some(f => f._existing);
      if (hadExisting && remove_all_param) {
        const form = input.form;
        if (form && !form.querySelector(`input[name="${cssEscape(remove_all_param)}"]`)) {
          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = remove_all_param;
          hidden.value = "1";
          form.appendChild(hidden);
        }
      }
      revokeAllObjectUrls();
      selectedFiles = [];
      input.value = "";
      syncNativeInput();
      render();
    }

    function cssEscape(val) {
      return (val || "").replace(/"/g, '\\"');
    }

    function formatBytes(bytes) {
      if (!bytes) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }

    function render() {
      selectedFilesContainer.innerHTML = "";
      clearStatus();

      if (!selectedFiles.length) {
        btnClear.style.display = "none";
        return;
      }
      btnClear.style.display = "inline-block";

      const totalSize = selectedFiles.reduce((s, f) => s + (f.size || 0), 0);

      const header = document.createElement("p");
      header.className = "mb-2 fw-semibold";
      header.textContent = `${t.selected_label}: ${selectedFiles.length} – ${formatBytes(totalSize)}`;
      selectedFilesContainer.appendChild(header);

      const list = document.createElement("div");
      list.className = "row g-2";

      selectedFiles.forEach((file, index) => {
        const col = document.createElement("div");
        col.className = "col";
        col.style.flex = "0 0 calc(100% / 7)";
        col.style.minWidth = "120px";

        const card = document.createElement("div");
        card.className = "border rounded p-2 d-flex flex-column text-center h-100 file-card";

        const body = document.createElement("div");
        body.className = "flex-grow-1 d-flex flex-column justify-content-center align-items-center";

        const isImage = (file.type || "").startsWith("image/");
        if (isImage && (file._url || file instanceof File)) {
          const img = document.createElement("img");
          img.style.width = "48px";
          img.style.height = "48px";
          img.style.objectFit = "cover";
          img.style.borderRadius = "4px";
          img.alt = file.name;
          if (file._existing && file._url) {
            img.src = file._url;
          } else if (file instanceof File) {
            const blobUrl = URL.createObjectURL(file);
            objectUrls.add(blobUrl);
            img.src = blobUrl;
          }
          body.appendChild(img);
        } else {
          const icon = document.createElement("i");
          icon.className = "fas fa-file";
          icon.style.fontSize = "2.2rem";
          icon.style.color = "#6c757d";
          body.appendChild(icon);
        }

        const nameDiv = document.createElement("div");
        nameDiv.className = "small text-truncate mt-1 w-100";
        nameDiv.title = file.name;
        nameDiv.textContent = file.name;
        body.appendChild(nameDiv);

        const sizeDiv = document.createElement("div");
        sizeDiv.className = "small text-muted";
        sizeDiv.textContent = formatBytes(file.size || 0);
        body.appendChild(sizeDiv);

        card.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "mt-auto w-100";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-sm btn-outline-danger w-100";
        btn.style.fontSize = "0.75rem";
        btn.setAttribute("aria-label", `Remove file ${file.name}`);
        btn.textContent = "Remove";
        btn.addEventListener("click", e => {
          e.stopPropagation();
          removeFile(index);
        });
        footer.appendChild(btn);
        card.appendChild(footer);

        col.appendChild(card);
        list.appendChild(col);
      });

      selectedFilesContainer.appendChild(list);

      if (selectedFiles.some(f => f._existing)) {
        const note = document.createElement("div");
        note.className = "small text-muted mt-1";
        note.textContent = t.existing_note;
        selectedFilesContainer.appendChild(note);
      }
    }

    render();
  });
};