#!/usr/bin/env bash
set -euo pipefail

image_name="burger-of-the-day-scraper"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

cd "${repo_root}"

docker build -t "${image_name}" .
docker run --rm -v "${repo_root}:/work" "${image_name}"
