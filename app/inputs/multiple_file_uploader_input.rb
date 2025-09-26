class MultipleFileUploaderInput < SimpleForm::Inputs::Base
  # Renders a container that our JS enhancer will transform into a DevExtreme
  # dxFileUploader. We keep an underlying real <input type="file" multiple>
  # (hidden) to integrate with Rails strong parameters (CarrierWave expects
  # param like model[files][]).
  #
  # Expected JS hooks (see app/javascript/multiple_file_uploader.js):
  #   data-provide="multiple_file_uploader" on the root wrapper
  #   data-input-target for the hidden input element
  #   data-list-target for the rendered file list
  def input(_wrapper_options = nil)
    # enforce multiple attribute and correct name with []
    input_html_options[:multiple] = true
    input_html_options[:name] ||= "#{@builder.object_name}[#{attribute_name}][]"
    input_html_options[:id] ||= input_dom_id
    input_html_options[:style] = "display:none;" unless input_html_options.key?(:style)

    template.content_tag(:div, class: "multiple-file-uploader", data: { provide: :multiple_file_uploader }) do
      # Hidden real field
      hidden_input = @builder.file_field(attribute_name, input_html_options.merge(data: { 'input-target': true }))

      # Placeholder where the DevExtreme widget will mount
      widget_container = template.content_tag(:div, "", class: "dx-uploader-mount")

      # Actions row (upload/clear buttons will be inserted by JS if desired)
      actions = template.content_tag(:div, "", class: "uploader-actions")

      # List of selected files (managed by JS)
      file_list = template.content_tag(:div, "", class: "uploader-files-list", data: { 'list-target': true })

      hidden_input.concat(widget_container).concat(actions).concat(file_list)
    end
  end

  private

  def input_dom_id
    [ @builder.object_name, attribute_name, "input" ].join("_")
  end
end
