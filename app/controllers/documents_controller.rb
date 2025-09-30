class DocumentsController < ApplicationController
  before_action :set_document, only: %i[show edit update destroy]

  def index
    @documents = Document.all
  end

  def show; end

  def new
    @document = Document.new
  end

  def edit; end

  def create
    @document = Document.new(filtered_document_params)

    respond_to do |format|
      if @document.save
        format.html { redirect_to @document, notice: "Document was successfully created." }
        format.json { render :show, status: :created, location: @document }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @document.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    attrs = filtered_document_params
    new_files = attrs.delete(:files)

    removed_ids = Array(params.dig(:document, :removed_files))
      if removed_ids.blank?
        files_node = params[:document].is_a?(ActionController::Parameters) ? params[:document][:files] : nil
        removed_ids = Array(files_node[:removed_files] || files_node["removed_files"]) if files_node.is_a?(ActionController::Parameters) || files_node.is_a?(Hash)
      end
    removed_ids = removed_ids.reject { |v| v.respond_to?(:blank?) ? v.blank? : v.nil? }

    if removed_ids.any?
      remaining = @document.files.reject { |u| removed_ids.include?(u.identifier) }
    else
      remaining = @document.files
    end

    @document.assign_attributes(attrs) if attrs.present?

    final_files = new_files.present? ? (remaining + new_files) : remaining

    final_files = final_files.uniq do |u|
      if u.respond_to?(:identifier) && u.identifier.present?
        u.identifier
      elsif u.respond_to?(:original_filename)
        "#{u.original_filename}-#{(u.size rescue 0)}"
      else
        u.object_id
      end
    end

    @document.files = final_files

    respond_to do |format|
      if @document.save
        format.html { redirect_to @document, notice: "Document was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @document }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @document.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @document.destroy!
    respond_to do |format|
      format.html { redirect_to documents_path, notice: "Document was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_document
    @document = Document.find(params.expect(:id))
  end

  # Only allow a list of trusted parameters through.
  def document_params
    params.expect(document: [ { files: [] } ])
  end

  def filtered_document_params
    raw = document_params
    raw = { files: raw } if raw.is_a?(Array)

    files = Array(raw[:files])
            .reject { |f| f.respond_to?(:blank?) ? f.blank? : f.nil? }
            .select { |f| f.is_a?(ActionDispatch::Http::UploadedFile) }

    raw[:files] = files if files.any?
    raw.delete(:files) if files.empty?
    raw
  end
end
