// MultipleFileUploader
// Enhances the custom SimpleForm input rendered by MultipleFileUploaderInput
// Requires devextreme (installed via npm) assets to be available.
// It mounts a dxFileUploader widget and keeps a hidden native input updated so
// Rails / CarrierWave receives params as usual.

import 'devextreme/dist/css/dx.light.css'
import dxFileUploader from 'devextreme/ui/file_uploader'
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
        const name = document.createElement('div')
        name.className = 'mf-name'
        name.textContent = entry.file.name
        const size = document.createElement('div')
        size.className = 'mf-size'
        size.textContent = fmtBytes(entry.file.size)
        const removeBtn = document.createElement('button')
        removeBtn.type = 'button'
        removeBtn.className = 'btn btn-sm btn-outline-danger'
        removeBtn.innerHTML = 'Remove'
        removeBtn.addEventListener('click', () => {
          if (entry.thumb) URL.revokeObjectURL(entry.thumb)
          selected.splice(idx, 1)
          syncHiddenInput()
          renderList()
        })
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
      pending.forEach(f => selected.push({ file: f }))
      if (pending.length) {
        syncHiddenInput()
        renderList()
      }
    }

    // Initialize dxFileUploader widget
    const uploader = new dxFileUploader(mountEl, {
      multiple: true,
      selectButtonText: 'Select files',
      labelText: 'Drag & drop or click',
      accept: ALLOWED_EXT.map(e => '.' + e).join(','),
      uploadMode: 'useForm',
      onValueChanged(e) {
        addFiles(e.value || [])
        try { uploader.option('value', []) } catch (_) {}
      }
    })

    // Clear button
    const clearBtnEl = document.createElement('div')
    actionsEl.appendChild(clearBtnEl)
    const clearBtn = new Button(clearBtnEl, {
      text: 'Clear',
      stylingMode: 'outlined',
      onClick() {
        selected.forEach(e => { if (e.thumb) URL.revokeObjectURL(e.thumb) })
        selected = []
        syncHiddenInput()
        renderList()
      }
    })

    // Basic styles (scoped minimal inline) – could be moved to SCSS
    const styleId = 'mf-uploader-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .multiple-file-uploader { border:1px solid #e5e5e5; padding:12px; border-radius:6px; margin-bottom:1rem; }
        .multiple-file-uploader .uploader-files-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; margin-top:12px; }
        .multiple-file-uploader .mf-file-card { border:1px solid #ddd; border-radius:4px; padding:6px; display:flex; flex-direction:column; gap:4px; font-size:0.85rem; }
        .multiple-file-uploader .mf-name { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .multiple-file-uploader .mf-size { color:#666; }
      `
      document.head.appendChild(style)
    }

    renderList()
  })
}