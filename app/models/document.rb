class Document < ApplicationRecord
  mount_uploaders :files, AttachmentUploader
end
