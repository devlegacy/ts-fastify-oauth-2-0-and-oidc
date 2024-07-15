#!/usr/bin/env sh

# NOTE: Use this script without symlinks because it will link ./.etc/.vscode to ./.vscode allowing users to alter the original files
# NOTE: Use chmod +x

source $(dirname "$0")/include/global
src="$(pwd)/.etc/.vscode"
dest="$(pwd)/.vscode"

echo "[$(current_timestamp)] Running start on $(pwd)"
if [ ! -d "$dest" ]; then
  echo "[$(current_timestamp)] Create .vscode directory"
  mkdir "$dest"
fi
# for file in ./../.etc/.vscode; do ln -s "$(pwd)/$file" /ruta/al/directorio-de-destino/"$file"; done
# for file in .etc/.vscode/*; do echo "$(pwd)/$file" ; done
for file in "$src"/*; do
  filename=$(basename "$file")
  dest_ln="$dest/$filename"

  # echo "$dest_ln"
  if [ -e "$dest_ln" ]; then
    echo "[$(current_timestamp)] Removing old ${COLOR_GREEN}<${filename}>${COLOR_RESET} simbolic link"
    rm "$dest_ln"
  fi

  echo "[$(current_timestamp)] Adding new ${COLOR_GREEN}<${filename}>${COLOR_RESET} simbolic hard link"
  ln "$file" "$dest_ln"
done
