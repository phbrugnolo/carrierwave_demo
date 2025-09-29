// MultipleFileUploader
// Enhances the custom SimpleForm input rendered by MultipleFileUploaderInput
// Requires devextreme (installed via npm) assets to be available.
// It mounts a FileUploader widget and keeps a hidden native input updated so
// Rails / CarrierWave receives params as usual.

import 'devextreme/dist/css/dx.light.css'
import FileUploader from 'devextreme/ui/file_uploader'
import notify from 'devextreme/ui/notify'
import Button from 'devextreme/ui/button'

const MAX_FILES = 10
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt']

const fileExt = (name) => (name.split('.').pop() || '').toLowerCase()
const fmtBytes = (b) => {
  if (b === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}
const toast = (message, type = 'info') => notify({ message }, type, 3000)

export const MultipleFileUploader = () => {
  document.querySelectorAll('div[data-provide="multiple_file_uploader"]').forEach((root) => {
    if (root.dataset.enhanced) return
    root.dataset.enhanced = 'true'

    const hiddenInput = root.querySelector('[data-input-target]')
    const mountEl = root.querySelector('.dx-uploader-mount')
    const listEl = root.querySelector('[data-list-target]')
    const actionsEl = root.querySelector('.uploader-actions')
    let selected = [] // { file, thumb }

    const syncHiddenInput = () => {
      // Use DataTransfer to assign FileList to hidden file input
      const dt = new DataTransfer()
      selected.forEach(e => dt.items.add(e.file))
      hiddenInput.files = dt.files
    }

    const renderList = () => {
      listEl.innerHTML = ''
      if (!selected.length) {
        listEl.classList.add('empty')
        return
      }
      listEl.classList.remove('empty')
      const total = selected.reduce((s, f) => s + f.file.size, 0)
      selected.forEach((entry, idx) => {
        const card = document.createElement('div')
        card.className = 'mf-file-card'
        // Preview area
        const preview = document.createElement('div')
        preview.className = 'mf-preview'
        const ext = fileExt(entry.file.name)
        if (entry.thumb) {
          const img = document.createElement('img')
          img.src = entry.thumb
          img.alt = entry.file.name
          img.className = 'mf-thumb'
          preview.appendChild(img)
        } else {
          const span = document.createElement('div')
          span.className = 'mf-icon'
          // Choose a FontAwesome icon class based on extension
          let iconClass = 'fa-file'
          if (['jpg','jpeg','png','gif','webp'].includes(ext)) iconClass = 'fa-file-image'
          else if (['pdf'].includes(ext)) iconClass = 'fa-file-pdf'
          else if (['doc','docx'].includes(ext)) iconClass = 'fa-file-word'
          else if (['txt','md','rtf'].includes(ext)) iconClass = 'fa-file-lines'
          span.innerHTML = `<i class="fa-solid ${iconClass}"></i>`
          preview.appendChild(span)
        }
        const name = document.createElement('div')
        name.className = 'mf-name'
        name.textContent = entry.file.name
        const size = document.createElement('div')
        size.className = 'mf-size'
        size.textContent = fmtBytes(entry.file.size)
        const removeBtn = document.createElement('button')
        removeBtn.type = 'button'
        removeBtn.className = 'btn btn-sm btn-outline-danger mf-remove'
        removeBtn.setAttribute('aria-label', 'Remove file')
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'
        removeBtn.addEventListener('click', () => {
          if (entry.thumb) URL.revokeObjectURL(entry.thumb)
          selected.splice(idx, 1)
          syncHiddenInput()
          renderList()
        })
        card.appendChild(preview)
        card.appendChild(name)
        card.appendChild(size)
        card.appendChild(removeBtn)
        listEl.appendChild(card)
      })
      toast(`Selected: ${selected.length} – ${fmtBytes(total)}`)
    }

    const addFiles = (files) => {
      const pending = []
      const warnings = []
      for (const f of files) {
        if (selected.length + pending.length >= MAX_FILES) { warnings.push('Maximum number of files reached'); break }
        if (f.size > MAX_SIZE) { warnings.push(`"${f.name}" > 5MB`); continue }
        if (!ALLOWED_EXT.includes(fileExt(f.name))) { warnings.push(`Type not allowed: ${f.name}`); continue }
        if (selected.some(s => s.file.name === f.name && s.file.size === f.size)) { warnings.push(`Duplicate: ${f.name}`); continue }
        pending.push(f)
      }
      if (warnings.length) toast(warnings.join(' • '), 'warning')
      pending.forEach(f => {
        const thumb = f.type.startsWith('image/') ? URL.createObjectURL(f) : null
        selected.push({ file: f, thumb })
      })
      if (pending.length) {
        syncHiddenInput()
        renderList()
      }
    }

    // Initialize dxFileUploader widget
    const uploader = new FileUploader(mountEl, {
      multiple: true,
      selectButtonText: 'Select files',
      labelText: 'Drag & drop or click',
      accept: ALLOWED_EXT.map(e => '.' + e).join(','),
      uploadMode: 'useForm',
      onValueChanged(e) {
        addFiles(e.value || [])
        try { uploader.option('value', []) } catch (_) { }
      }
    })

    // Clear button
    const clearBtnEl = document.createElement('div')
    actionsEl.appendChild(clearBtnEl)
    new Button(clearBtnEl, {
      text: 'Clear',
      stylingMode: 'outlined',
      onClick() {
        selected.forEach(e => { if (e.thumb) URL.revokeObjectURL(e.thumb) })
        selected = []
        syncHiddenInput()
        renderList()
      }
    })

    // Styles now provided via SCSS (app/assets/stylesheets/multiple_file_uploader.scss)

    renderList()
  })
}