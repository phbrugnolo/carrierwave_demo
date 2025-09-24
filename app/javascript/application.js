// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"
import * as bootstrap from "bootstrap"
import "./multiple_file_uploader"


import { MultipleFileUploader } from './multiple_file_uploader';

document.addEventListener('turbo:load', () => {
  document.querySelectorAll('[data-provide="multiple-file-uploader"]').forEach(el => {
    new MultipleFileUploader(el);
  });
});