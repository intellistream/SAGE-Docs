sync:
	python sync_readme.py

serve: sync
	zensical serve

build: sync
	zensical build --clean
