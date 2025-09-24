class AttachmentUploader < CarrierWave::Uploader::Base
  storage :file

  def store_dir
    "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
  end

  def filename
    super.present? ? I18n.transliterate(super).downcase.gsub(" ", "") : super
  end

  def extension_allowlist
    %w[pdf docx txt jpg jpeg png gif]
  end
end
