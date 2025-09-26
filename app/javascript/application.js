// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"
import "bootstrap"
import { MultipleFileUploader } from "./multiple_file_uploader"

document.addEventListener("turbo:load", () => {
  MultipleFileUploader()
})