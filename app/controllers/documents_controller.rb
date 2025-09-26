class DocumentsController < ApplicationController
  before_action :set_document, only: %i[ show edit update destroy ]

  # GET /documents or /documents.json
  def index
    @documents = Document.all
  end

  # GET /documents/1 or /documents/1.json
  def show
  end

  # GET /documents/new
  def new
    @document = Document.new
  end

  # GET /documents/1/edit
  def edit
  end

  # POST /documents or /documents.json
  def create
    @document = Document.new(document_params)

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

  # PATCH/PUT /documents/1 or /documents/1.json
  def update
    # Estratégia: CarrierWave substitui o array inteiro ao atribuir files=.
    # Precisamos mesclar os arquivos existentes com os novos, removendo duplicados por nome normalizado.
    new_files = Array(document_params[:files]).reject(&:blank?)

    # Se nenhum arquivo novo chegou e não há comandos de remoção, apenas redireciona (nada mudou).
    return redirect_to(@document, notice: "Document was successfully updated.", status: :see_other) if new_files.empty? && removal_list.empty? && !remove_all?

    existing = Array(@document.files)

    # Aplicar remoções específicas (por nome) se vierem do form.
    unless removal_list.empty?
      normalized_removals = removal_list.map { |n| normalize_filename(n) }.to_set
      existing = existing.reject do |u|
        normalized_removals.include?(normalize_filename(File.basename(u.path || u.url)))
      end
    end

    existing = [] if remove_all?

    merged = existing + new_files

    # Remover duplicados por nome (mantém primeira ocorrência: se novo tem mesmo nome de existente, substituímos preservando o novo ao final => então invert + uniq + invert).
    merged = merged.reverse.uniq do |f|
      if f.respond_to?(:original_filename)
        normalize_filename(f.original_filename)
      else
        normalize_filename(File.basename(f.path || f.url)) rescue object_id.to_s
      end
    end.reverse

    @document.files = merged

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

  # DELETE /documents/1 or /documents/1.json
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

    # Lista de nomes de arquivos existentes a remover (virá de um campo hidden futuro: document[remove_existing][])
    def removal_list
      Array(params.dig(:document, :remove_existing)).reject(&:blank?)
    end

    def remove_all?
      ActiveModel::Type::Boolean.new.cast(params.dig(:document, :remove_all_files))
    end

    def normalize_filename(name)
      I18n.transliterate(name.to_s).downcase.gsub(/\s+/, "")
    end
end
