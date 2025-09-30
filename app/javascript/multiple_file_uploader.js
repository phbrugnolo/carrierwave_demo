import FileUploader from 'devextreme/ui/file_uploader'
import notify from 'devextreme/ui/notify'
import Button from 'devextreme/ui/button'

const MAX_FILES = 10
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt']

const fileExt = (name) => (name.split('.').pop() || '').toLowerCase()
const toast = (message, type = 'info') => notify({ message }, type, 3000)
const fmtBytes = (b) => {
  if (b === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}
const removedParamName = (hiddenInputName) => {
  const m = hiddenInputName.match(/^([^\[]+)\[([^\]]+)\](?:\[\])?$/)
  if (!m) return 'removed_files[]'
  const model = m[1]
  const attr = m[2]
  return `${model}[removed_${attr}][]`
}

export const MultipleFileUploader = () => {
  document.querySelectorAll('div[data-provide="multiple_file_uploader"]').forEach((root) => {
    if (root.dataset.enhanced) return
    root.dataset.enhanced = 'true'

    const hiddenInput = root.querySelector('[data-input-target]')
    const mountEl = root.querySelector('.dx-uploader-mount')
    const dropZoneEl = root.querySelector('[data-dropzone-target]')
    const listEl = root.querySelector('[data-list-target]')
    const actionsEl = root.querySelector('.uploader-actions')

    const removedContainer = document.createElement('div')
    removedContainer.style.display = 'none'
    root.appendChild(removedContainer)

    let selected = []

    const syncHiddenInput = () => {
      const dt = new DataTransfer()
      selected.filter(e => !e.existing).forEach(e => dt.items.add(e.file))
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
          let iconClass = 'fa-file'
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) iconClass = 'fa-file-image'
          else if (['pdf'].includes(ext)) iconClass = 'fa-file-pdf'
          else if (['doc', 'docx'].includes(ext)) iconClass = 'fa-file-word'
          else if (['txt', 'md', 'rtf'].includes(ext)) iconClass = 'fa-file-lines'
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
          if (entry.thumb && entry.thumb.startsWith('blob:')) URL.revokeObjectURL(entry.thumb)

          if (entry.existing && entry.id) {
            const removeInput = document.createElement('input')
            removeInput.type = 'hidden'
            removeInput.name = removedParamName(hiddenInput.name)
            removeInput.value = entry.id
            if (![...removedContainer.querySelectorAll('input')].some(i => i.value === removeInput.value)) {
              removedContainer.appendChild(removeInput)
            }
          }

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
      if (warnings.length) { toast(warnings.join(' • '), 'warning'); }
      pending.forEach(f => {
        const thumb = f.type.startsWith('image/') ? URL.createObjectURL(f) : null
        selected.push({ file: f, thumb })
      })
      if (pending.length) {
        syncHiddenInput()
        renderList()
      }
    }

    const uploader = new FileUploader(mountEl, {
      multiple: true,
      selectButtonText: 'Select files',
      labelText: 'Drag & drop or click',
      accept: ALLOWED_EXT.map(e => '.' + e).join(','),
      uploadMode: 'useForm',
      dropZone: dropZoneEl || undefined,
      dialogTrigger: dropZoneEl || undefined,
      onValueChanged(e) {
        addFiles(e.value || [])
        try { uploader.option('value', []) } catch (_) { }
      }
    })

    if (dropZoneEl) {
      const dz = dropZoneEl
      const dragClass = 'dragover'

      const isFileDrag = (ev) => {
        return ev.dataTransfer && Array.from(ev.dataTransfer.types || []).includes('Files')
      }

      const onDragEnter = (ev) => {
        if (!isFileDrag(ev)) return
        ev.preventDefault()
        dz.classList.add(dragClass)
      }
      const onDragOver = (ev) => {
        if (!isFileDrag(ev)) return
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'copy'
      }
      const onDragLeave = (ev) => {
        if (!isFileDrag(ev)) return
        if (ev.target === dz) {
          dz.classList.remove(dragClass)
        }
      }
      const onDrop = (ev) => {
        if (!isFileDrag(ev)) return
        ev.preventDefault()
        dz.classList.remove(dragClass)
        const files = ev.dataTransfer.files
        if (files && files.length) addFiles(files)
      }

      dz.addEventListener('dragenter', onDragEnter)
      dz.addEventListener('dragover', onDragOver)
      dz.addEventListener('dragleave', onDragLeave)
      dz.addEventListener('drop', onDrop)

      // Keyboard activation (Space/Enter triggers native dialog)
      dz.addEventListener('keydown', (e) => {
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault()
          // Use underlying hidden input click
          const inputEl = mountEl.querySelector('input[type="file"]')
          if (inputEl) inputEl.click()
        }
      })
    }

    const clearBtnEl = document.createElement('div')
    actionsEl.appendChild(clearBtnEl)

    const ensureRemoveInput = (id) => {
      if (!id) return
      const name = removedParamName(hiddenInput.name)
      if (![...removedContainer.querySelectorAll('input')].some(i => i.value === id)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = id
        removedContainer.appendChild(input)
      }
    }

    new Button(clearBtnEl, {
      text: 'Clear',
      stylingMode: 'outlined',
      onClick() {
        selected.filter(e => e.existing).forEach(e => ensureRemoveInput(e.id))
        selected.filter(e => !e.existing && e.thumb && e.thumb.startsWith('blob:')).forEach(e => URL.revokeObjectURL(e.thumb))
        selected = []
        syncHiddenInput()
        renderList()
      }
    })

    try {
      const raw = root.dataset.existingFiles || root.dataset.existing_files
      if (raw) {
        const parsed = JSON.parse(raw)
        parsed.forEach(obj => {
          const name = obj.identifier || 'undefined'
          const id = obj.identifier || name
          const pseudoFile = new File([new Blob()], name, { type: 'application/octet-stream' })
          Object.defineProperty(pseudoFile, 'size', { value: obj.size || 0 })
          const ext = fileExt(name)
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
          const thumb = isImage && obj.url ? obj.url : null
          selected.push({ file: pseudoFile, thumb, existing: true, id, url: obj.url })
        })
      }
    } catch (e) {
      console.warn('MultipleFileUploader existing files parse error', e)
    }

    renderList()
  })
}