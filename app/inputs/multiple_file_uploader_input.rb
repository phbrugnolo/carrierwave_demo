class MultipleFileUploaderInput < SimpleForm::Inputs::Base
  def input(_wrapper_options)
    max_files    = options.fetch(:max_files, 10)
    max_file_mb  = options.fetch(:max_file_mb, 5)
    accept_types = options.fetch(:accept, ".pdf,.jpg,.jpeg,.png,.doc,.docx")

    object_param_key = object_name
    remove_existing_param = "#{object_param_key}[remove_existing][]"
    remove_all_param      = "#{object_param_key}[remove_all_files]"

    default_texts = {
      drag_drop_html:    '<strong>Drag & drop</strong> files here or <button type="button" class="btn btn-link p-0" data-trigger>click to select</button>.',
      support_text:      "You can select multiple files. Allowed types: PDF, Images, DOC. Max files: #{max_files}. Max per file: #{max_file_mb} MB.",
      selected_label:    "Selected",
      remove_all_btn:    "Clear All",
      existing_note:     "Existing files will remain unless removed. Removing an existing file marks it for deletion.",
      duplicate_warning: "Some files were ignored because they have duplicate names:",
      too_many_files:    "Maximum of %{max} files allowed.",
      file_too_large:    "File %{name} exceeds %{limit} MB."
    }
    user_texts = options.fetch(:texts, {})
    texts = default_texts.merge(user_texts.transform_keys(&:to_sym))

    input_html_options[:multiple] = true
    input_html_options[:accept] ||= accept_types
    input_html_options[:class] = [ input_html_options[:class], "visually-hidden" ].compact.join(" ")
    input_id = input_html_options[:id] ||= "#{object_name}_#{attribute_name}"
    input_html_options[:data] = (input_html_options[:data] || {}).merge(provide: :multiple_file_uploader)

    existing_files = Array(object.send(attribute_name)).compact.select(&:present?).map do |file_obj|
      name =
        if file_obj.respond_to?(:identifier) && file_obj.identifier.present?
          file_obj.identifier.to_s
        elsif file_obj.respond_to?(:filename) && file_obj.filename.present?
          file_obj.filename.to_s
        elsif file_obj.respond_to?(:file) && file_obj.file.respond_to?(:filename)
          file_obj.file.filename.to_s
        else
          File.basename(file_obj.try(:path) || file_obj.try(:url) || "file")
        end

      url =
        if file_obj.respond_to?(:url)
          file_obj.url
        elsif file_obj.respond_to?(:service_url)
          file_obj.service_url
        end

      size =
        if file_obj.respond_to?(:byte_size)
          file_obj.byte_size
        elsif file_obj.respond_to?(:size)
          file_obj.size rescue nil
        elsif file_obj.respond_to?(:path)
          (File.size?(file_obj.path) rescue nil)
        end

      content_type =
        if file_obj.respond_to?(:content_type)
          file_obj.content_type
        elsif file_obj.respond_to?(:file) && file_obj.file.respond_to?(:content_type)
          file_obj.file.content_type
        end

      {
        name: name,
        url: url,
        size: size,
        content_type: content_type
      }.compact
    end

    data_config = {
      existing_files: existing_files,
      max_files: max_files,
      max_file_mb: max_file_mb,
      remove_existing_param: remove_existing_param,
      remove_all_param: remove_all_param,
      texts: texts
    }

    file_field = @builder.file_field(attribute_name, input_html_options)

    template.content_tag(:div, class: "mb-4 multiple-file-uploader-wrapper") do
      template.concat(
        template.content_tag(:div, class: "d-flex align-items-center justify-content-between mb-1") do
          template.concat template.content_tag(:label, (options[:label] || object.class.human_attribute_name(attribute_name) rescue "Upload"), for: input_id, class: "form-label mb-0")
          template.concat template.content_tag(:button,
            texts[:remove_all_btn],
            type: "button",
            class: "btn btn-sm btn-outline-secondary",
            id: "#{input_id}_btn_clear",
            style: "display:none;"
          )
        end
      )

      template.concat(
        template.content_tag(:div,
          id: "#{input_id}_dropZone",
          class: "border border-2 rounded p-4 text-center position-relative",
          style: "background-color:#f8f9fa;border-style:dashed !important;cursor:pointer;",
          role: "button",
          tabindex: "0",
          "aria-label": "File upload area",
          data: { uploader_config: data_config.to_json }
        ) do
          template.safe_join([
            template.content_tag(:div, template.content_tag(:i, "", class: "fas fa-upload", style: "font-size:2rem;color:#6c757d;"), class: "mb-3"),
            template.content_tag(:p, template.raw(texts[:drag_drop_html]), class: "mb-2"),
            template.content_tag(:small, texts[:support_text], class: "text-muted d-block mb-2"),
            file_field,
            template.content_tag(:div, "", id: "#{input_id}_status", class: "visually-hidden", "aria-live": "polite"),
            template.content_tag(:div, "", id: "#{input_id}_selectedFiles", class: "mt-3 text-start", "aria-label": "Selected files list")
          ])
        end
      )
    end
  end
end
