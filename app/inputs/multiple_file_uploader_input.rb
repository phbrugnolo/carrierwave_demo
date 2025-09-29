class MultipleFileUploaderInput < SimpleForm::Inputs::Base
  def input(_wrapper_options = nil)
    input_html_options[:multiple] = true
    input_html_options[:name] ||= "#{@builder.object_name}[#{attribute_name}][]"
    input_html_options[:id] ||= "#{@builder.object_name}_#{attribute_name}"
    input_html_options[:style] = "display:none;" unless input_html_options.key?(:style)

    existing_files = []
    if @builder.object.respond_to?(attribute_name) && (uploaded_files = @builder.object.send(attribute_name)).present?
      Array(uploaded_files).each do |f|
        existing_files << {
          identifier: f.identifier,
          size: (f.size if f.respond_to?(:size)),
          url: f.url
        }.compact
      end
    end

    data_attrs = { provide: :multiple_file_uploader }
    data_attrs[:existing_files] = existing_files.to_json if existing_files.any?

    template.content_tag(:div, class: "multiple-file-uploader", data: data_attrs) do
      hidden_input     = @builder.file_field(attribute_name, input_html_options.merge(data: { 'input-target': true }))
      widget_container = template.content_tag(:div, "", class: "dx-uploader-mount")
      actions          = template.content_tag(:div, "", class: "uploader-actions")
      file_list        = template.content_tag(:div, "", class: "uploader-files-list", data: { 'list-target': true })

      hidden_input.concat(widget_container).concat(actions).concat(file_list)
    end
  end
end
