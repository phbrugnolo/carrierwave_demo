class CreateDocuments < ActiveRecord::Migration[8.0]
  def change
    create_table :documents do |t|
      t.jsonb :files
      t.references :person, null: false, foreign_key: true

      t.timestamps
    end
  end
end
