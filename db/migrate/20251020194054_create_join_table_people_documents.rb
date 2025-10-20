class CreateJoinTablePeopleDocuments < ActiveRecord::Migration[8.0]
  def change
    create_join_table :people, :documents do |t|
      t.index [ :person_id, :document_id ]
      t.index [ :document_id, :person_id ]
    end
  end
end
