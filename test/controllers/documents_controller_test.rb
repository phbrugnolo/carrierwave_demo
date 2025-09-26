require "test_helper"

class DocumentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @document = documents(:one)
  end

  test "should get index" do
    get documents_url
    assert_response :success
  end

  test "should get new" do
    get new_document_url
    assert_response :success
  end

  test "should create document" do
    assert_difference("Document.count") do
      post documents_url, params: { document: { files: @document.files } }
    end

    assert_redirected_to document_url(Document.last)
  end

  test "should show document" do
    get document_url(@document)
    assert_response :success
  end

  test "should get edit" do
    get edit_document_url(@document)
    assert_response :success
  end

  test "should update document" do
    patch document_url(@document), params: { document: { files: @document.files } }
    assert_redirected_to document_url(@document)
  end

  test "adding new file keeps existing ones" do
    # Simula que o documento já possui um upload salvo (precisamos anexar manualmente em runtime porque fixture está vazia)
    existing_file_path = Rails.root.join("test", "fixtures", "files", "sample.txt")
    File.write(existing_file_path, "existing") unless File.exist?(existing_file_path)
    @document.files = [ Rack::Test::UploadedFile.new(existing_file_path, "text/plain") ]
    @document.save!

    new_file_path = Rails.root.join("test", "fixtures", "files", "another.txt")
    File.write(new_file_path, "new file") unless File.exist?(new_file_path)
    new_upload = Rack::Test::UploadedFile.new(new_file_path, "text/plain")

    assert_changes -> { @document.reload.files.size }, from: 1, to: 2 do
      patch document_url(@document), params: { document: { files: [ new_upload ] } }
      assert_redirected_to document_url(@document)
    end

    names = @document.reload.files.map { |u| File.basename(u.path || u.url) }
    assert_includes names, "sample.txt"
    assert_includes names, "another.txt"
  end

  test "should destroy document" do
    assert_difference("Document.count", -1) do
      delete document_url(@document)
    end

    assert_redirected_to documents_url
  end
end
