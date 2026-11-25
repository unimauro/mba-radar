# Tareas del proyecto (sin dependencias: Python 3 y Node >= 18).
PORT ?= 8791

.PHONY: build test links serve check

build:  ## Regenera data/paises/*.json y data/global.json
	python3 etl/build.py

test:   ## Pruebas del modelo financiero y del esquema de datos
	node --test tests/

check:  ## Sintaxis de todos los módulos JS
	@for f in js/*.js; do node --check $$f || exit 1; done; echo "js OK"

links:  ## Verifica las URLs citadas (sale con error si hay 404)
	python3 etl/check_links.py

serve:  ## Servidor local en http://localhost:$(PORT)/
	python3 -m http.server $(PORT)
