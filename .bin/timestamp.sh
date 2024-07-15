#!/usr/bin/env sh

function timestamp() {
  echo $(date +"%Y-%m-%d %T");
}

export -f timestamp
