## CarrierWave Demo (Rails 8)

A minimal Rails 8.0 application demonstrating multiple file uploads with CarrierWave plus the modern Rails 8 defaults (Solid Queue, Solid Cache, Solid Cable, Propshaft, Turbo, Stimulus, esbuild, Sass/PostCSS, Bootstrap).

### At a Glance
* **Ruby**: 3.4.5
* **Rails**: ~> 8.0.3
* **Database**: PostgreSQL
* **Uploads**: CarrierWave storing files on the filesystem under `public/uploads`
* **Primary Model**: `Document` with a `files` JSON/array column (multiple uploads)
* **Frontend Tooling**: esbuild + Sass + PostCSS (autoprefixer) + Bootstrap 5
* **Background / Caching**: Solid Queue, Solid Cache, Solid Cable (configured, not custom used yet)
* **Deployment (container)**: Production Dockerfile + Thruster + Kamal ready

---
## 1. Features
* Multiple file upload (`mount_uploaders :files, AttachmentUploader`)
* Filename normalization & accent stripping via `I18n.transliterate`
* Extension allow‑list: pdf, docx, txt, jpg, jpeg, png, gif
* Clean asset pipeline using Propshaft and JS/CSS bundling gems
* Foreman / Procfile based development (`bin/dev`)
* Health check at `/up`

---
## 2. Local Development Setup

### 2.1 Prerequisites
Install locally (or let the provided `scripts/workspace.sh` provision a Linux dev VM):
* Ruby 3.4.5 (RVM, rbenv, or asdf)
* PostgreSQL 14+ (or run the provided Docker container — see below)
* Node.js (>= 20 LTS recommended) + Yarn (v4 is specified in `package.json`)
* Git, build tools (gcc, make), libpq headers

Optional: Docker (for database or full app image) & Kamal for deployment.

### 2.2 Clone & Install
```bash
git clone <repo-url> carrierwave_demo
cd carrierwave_demo

# Install gems
bundle install

# Install JS dependencies
yarn install --check-files
```

### 2.3 Database Setup
```bash
bin/rails db:prepare   # create + migrate
# or to recreate from scratch (drops everything):
bash scripts/recreate_database.sh
```

### 2.4 Start Development Environment
`bin/dev` invokes Foreman and runs the processes defined in `Procfile.dev`:
* `web`: Rails server (with Ruby debug open)
* `js`: esbuild in watch mode
* `css`: Sass/PostCSS watcher via nodemon

```bash
bin/dev
```
Then visit: http://localhost:3000

### 2.5 Seed Data
Add any seeds to `db/seeds.rb` then:
```bash
bin/rails db:seed
```

---
## 3. File Uploads (CarrierWave)
* Uploaded files are stored (development) under: `public/uploads/document/files/:id/`
* Uploader: `AttachmentUploader`
	* `store_dir` defines the directory structure
	* `filename` transliterates & lowercases the original name and removes spaces
	* Allowed extensions: pdf docx txt jpg jpeg png gif
* Multiple files: controller strong parameters use `params.expect(document: [ { files: [] } ])` so you must submit `document[files][]` for each file.

Sample form field (already present in the scaffold):
```erb
<%= f.file_field :files, multiple: true %>
```

---
## 4. Running Tests
Rails default test framework (Minitest) is enabled.
```bash
bin/rails test          # model + controller + unit tests
bin/rails test:system   # system (Capybara) tests
```
Headless system tests use Selenium (ensure a compatible browser / driver; you may add `webdrivers` gem if needed).

---
## 5. JavaScript & CSS Build
Scripts (from `package.json`):
* `yarn build` – bundle JS once with esbuild (outputs to `app/assets/builds`)
* `yarn build:css` – compile + autoprefix Sass -> CSS
* `yarn watch:css` – watch SCSS changes

In dev you usually rely on `bin/dev` (watchers). For a one‑off production build:
```bash
RAILS_ENV=production bin/rails assets:precompile
```

---
## 6. Docker (Production Image)
Build & run (needs `config/master.key` or `RAILS_MASTER_KEY`):
```bash
docker build -t carrierwave_demo .
docker run -d -p 8080:80 \
	-e RAILS_MASTER_KEY=$(cat config/master.key) \
	--name carrierwave_demo carrierwave_demo
```
Then open http://localhost:8080

The production image:
* Uses multi-stage build (reduces final size)
* Precompiles assets without requiring real secret (dummy `SECRET_KEY_BASE_DUMMY`)
* Runs as non-root user `rails`
* Starts via Thruster for optimized static asset and sendfile handling

### 6.1 Local Postgres via Docker
The provisioning script creates containers:
```bash
bash ~/start_containers.sh   # created by scripts/workspace.sh
```
It launches `postgresql` + `pgAdmin` on port 8080 (inside the VM). Adjust DB credentials in `config/database.yml` if needed.

---
## 7. Deployment (Kamal Ready)
`kamal` gem is included. Typical flow (customize hosts/registry first):
```bash
bundle exec kamal deploy
```
Configuration lives in `config/deploy.yml`. Ensure your registry, servers, and secrets (master key) are set.

---
## 8. Important Scripts
* `bin/setup` – Idempotent project setup + launches dev server unless `--skip-server`
* `scripts/recreate_database.sh` – Full drop/create/migrate/seed cycle
* `bin/dev` – Runs Procfile (web + JS + CSS watchers)

---
## 9. Troubleshooting
| Issue | Fix |
|-------|-----|
| Files not appearing after upload | Check form uses `multipart: true` and multiple field syntax. Inspect logs. |
| 422 on create/update | Likely invalid extension; ensure allowed file types. |
| Assets not updating in browser | Ensure `bin/dev` running; clear `tmp/cache` or force reload. |
| DB connection errors | Confirm Postgres running & credentials in `config/database.yml`. |
| Tests failing with Selenium | Install a headless browser/driver (e.g. add `webdrivers` gem). |

---
## 10. Roadmap / Ideas
* Add background processing (e.g., image variants) via Active Storage or MiniMagick + CarrierWave versions
* Add validations (size limits, presence) to `Document`
* Add direct S3 storage option (switch `storage :file` to fog/aws)
* Add authentication/authorization
* Add CI pipeline (GitHub Actions)

---
## 11. License
This project is for demonstration/educational purposes. Add a license if you intend public distribution.

---
## 12. Reference
* Rails Guides: https://guides.rubyonrails.org
* CarrierWave: https://github.com/carrierwaveuploader/carrierwave
* Kamal: https://kamal-deploy.org
* Thruster: https://github.com/basecamp/thruster

---
Happy hacking!
