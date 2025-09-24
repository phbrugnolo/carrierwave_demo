class MultipleFileUploaderInput < SimpleForm::Inputs::Base
  # Builds a custom Bootstrap 5 drag & drop multi-file uploader input.
  # It renders:
  # - hidden native file input (multiple)
  # - container with icon, instructions, clear button placeholder
  # - previews area dynamically filled via JS
  # The JS hooks rely on `data-multiple-file-uploader-target` style dataset & simpler `data-provide`.
  def input(_wrapper_options)
    # Ensure multiple attribute is present
    input_html_options[:multiple] = true
    input_html_options[:class] = [ input_html_options[:class], "d-none" ].compact.join(" ")
    input_html_options.deep_merge!(data: { provide: "multiple-file-uploader", controller: "multiple-file-uploader" })

    # Build the hidden file field using SimpleForm's existing helpers
    file_field = @builder.file_field(attribute_name, input_html_options)

    # Unique IDs for JS queries
    wrapper_id = "uploader_#{object_name}_#{attribute_name}"
    clear_btn_id = "clear_#{object_name}_#{attribute_name}"
    previews_id = "previews_#{object_name}_#{attribute_name}"

    # Allowed extensions mirror uploader allowlist; size limits kept in JS for now
    instructions = <<~HTML
      <strong>Arraste e solte</strong> os arquivos aqui ou
      <button type="button" class="btn btn-link p-0" data-action="click->multiple-file-uploader#trigger">clique para selecionar</button>.
    HTML

    template = <<~HTML
      <div id="#{wrapper_id}" class="mb-3 multiple-file-uploader" data-provide="multiple-file-uploader" data-limit-files="10" data-max-file-size-mb="5">
        <label class="form-label d-flex align-items-center justify-content-between">
          <span>Arquivos</span>
          <button type="button" id="#{clear_btn_id}" class="btn btn-sm btn-outline-secondary" data-action="multiple-file-uploader#clear" style="display:none;">
            <i class="fas fa-times-circle me-1"></i>Limpar
          </button>
        </label>
        <div class="border border-2 border-dashed rounded p-4 text-center bg-light position-relative" data-action="dragover->multiple-file-uploader#dragOver dragleave->multiple-file-uploader#dragLeave drop->multiple-file-uploader#drop">
          <div class="mb-3">
            <i class="fas fa-upload" style="font-size:2rem;color:#6c757d;"></i>
          </div>
          <p class="mb-2">#{instructions}</p>
          <small class="text-muted d-block mb-2">Tipos permitidos: PDF, DOCX, TXT, Imagens. Máx arquivos: 10. Máx por arquivo: 5 MB.</small>
          #{file_field}
          <div id="#{previews_id}" class="mt-3 text-start" data-multiple-file-uploader-target="previews"></div>
        </div>
      </div>
    HTML

    template.html_safe
  end
end
