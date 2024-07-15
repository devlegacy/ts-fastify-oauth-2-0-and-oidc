#!/usr/bin/env sh

function load_env() {
  # echo "$1.env";
  # set -a;
  # while IFS= read -r line; do
  #   if echo "$line" | grep -q '^[^#]*='; then
  #     export "$line"
  #   fi
  # done < $1.env
  # echo "$GIT_NAME";
  set -a
  export "FOO=bar"
  export "BAR=baz"
  # declare -xr GIT_NAME="Samuel R."
  # echo "GIT_NAME=Samuel R. GIT_EMAIL=samuel_-_rojas@hotmail.com"
}
# export GIT_NAME='Samuel R.'

export -f load_env
# echo ${FOO}; \
# echo ${BAR}; \
# set -a; \
# export $"FOO=bar" ; \
# export $"BAR=baz" ; \
# while IFS= read -r line; do \
# 	if echo "$$line" | grep -q '^[^#]*='; then \
# 	  echo "export $$line"; \
# 		export "$$line"; \
# 	fi; \
# done < ./.env; \
# echo ${FOO}; \
# echo ${BAR}; \
