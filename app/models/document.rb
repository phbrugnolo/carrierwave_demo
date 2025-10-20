class Document < ApplicationRecord
  mount_uploaders :files, AttachmentUploader
  has_and_belongs_to_many :person
end
