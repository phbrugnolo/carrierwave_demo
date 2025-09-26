class MultipleFileUploaderInput < SimpleForm::Inputs::Base
  def input(_wrapper_options)
    input_html_options[:multiple] = true
    input_html_options[:accept] ||= ".pdf,.jpg,.jpeg,.png,.doc,.docx"
    input_html_options[:class] = [ input_html_options[:class], "d-none" ].compact.join(" ")
    input_id = input_html_options[:id] ||= "#{object_name}_#{attribute_name}"
    input_html_options[:data] = (input_html_options[:data] || {}).merge(provide: :multiple_file_uploader)

    file_field = @builder.file_field(attribute_name, input_html_options)

    template.content_tag(:div, class: "mb-4") do
      # label with clear button
      template.concat(
        template.content_tag(:label, class: "form-label d-flex align-items-center justify-content-between") do
          template.concat template.content_tag(:span, options[:label] || "Upload Input")
          template.concat template.content_tag(:button,
            template.raw('<i class="fas fa-times-circle me-1"></i>Clear'),
            type: "button",
            class: "btn btn-sm btn-outline-secondary",
            id: "#{input_id}_btn_clear",
            style: "display: none;"
          )
        end
      )

      # drop zone block
      existing_files = Array(object.send(attribute_name)).compact.select(&:present?)
      existing_files_data = existing_files.map do |u|
        {
          name: File.basename(u.path || u.url),
          url: u.url,
          size: (File.size?(u.path) rescue nil),
          content_type: (u.content_type if u.respond_to?(:content_type))
        }
      end

      template.concat(
        template.content_tag(:div,
          id: "#{input_id}_dropZone",
          class: "border border-2 rounded p-4 text-center",
          style: "background-color: #f8f9fa; border-style: dashed !important;",
          data: { existing_files: existing_files_data.to_json }
        ) do
          inner = "".dup
          inner << template.content_tag(:div, template.content_tag(:i, "", class: "fas fa-upload", style: "font-size: 2rem; color: #6c757d;"), class: "mb-3")
          inner << template.content_tag(:p, class: "mb-2") do
            template.raw(%(
              <strong>Drag and drop</strong> files here or
              <button type="button" class="btn btn-link p-0" data-trigger="#{input_id}">click to select</button>.
            ))
          end
          inner << template.content_tag(:small, "Supports multiple selection. Allowed types: PDF, Image, DOC. Max files: 10. Max per file: 5 MB.", class: "text-muted")
          inner << file_field
          inner << template.content_tag(:div, "", id: "#{input_id}_selectedFiles", class: "mt-3")
          template.raw(inner)
        end
      )
    end
  end
end
