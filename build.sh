#!/usr/bin/env bash
# 1. Install dependencies
python -m pip install --upgrade pip
python -m pip install -e ".[docs]"

# 2. Build the site
mkdocs build --clean
