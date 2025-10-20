class Document < ApplicationRecord
  mount_uploaders :files, AttachmentUploader
  belongs_to :person
end
