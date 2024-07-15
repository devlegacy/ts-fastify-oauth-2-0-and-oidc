current_work_directory := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
include .env
export $(shell sed 's/=.*//' .env)

include ./.bin/colors.sh
# define load_env
# $(shell source ./.bin/load_env.sh && load_env $1)
# endef

# $(shell $(source ./.bin/colors.sh))
# include ./.bin/timestamp.sh
# include_timestamp := source ./.bin/timestamp.sh

# include $(SHELL source ./.bin/timestamp.sh)
# define timestamp
# $(shell source ./.bin/timestamp.sh && timestamp)
# endef
# timestamp = $(shell $(include_timestamp) && timestamp)
# $(shell $(source ./.bin/timestamp.sh))
# include ./.bin/timestamp.sh

# include_print_message := source ./.bin/print_message.sh
# define print_message
# $(shell source ./.bin/print_message.sh && print_message $1)
# endef
# define print_message
# $(shell $(include_print_message) && print_message $1 $2)
# endef

# include ./.bin/colors.mk
# include ./.bin/load_env.mk
include ./.bin/timestamp.mk
include ./.bin/print_message.mk
include ./.bin/vscode.mk
# $(call load_env())
# current_work_directory := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
# include (current_work_directory).env
# By default, Make executes the first target defined in the Makefile when no target is specified.
# To control which target is executed by default, you can set the special variable .DEFAULT_GOAL.
# This variable allows you to specify a default target, improving readability and usability.
# Setting .DEFAULT_GOAL to 'help' ensures that the help target runs by default, providing a
# convenient overview of available commands and their descriptions.
.DEFAULT_GOAL := help

# Phony targets:
# In Make, targets are typically names of files that need to be generated or updated.
# However, sometimes you need targets that represent actions or commands, not files.
# The .PHONY target specifies which targets are not associated with actual files.
# By declaring a target as .PHONY, Make will execute the target's recipe even if a file
# with the same name exists in the project directory. This prevents potential conflicts
# and ensures the correct execution of custom commands.
# It's good practice to declare all custom targets as phony to avoid issues if a file
# with the same name is present in the project.
# .PHONY: build.elb globals help setup.vscode test update

# Purpose of @ in Makefiles
# Suppress Command Echoing: When you prefix a command with @, it prevents Make from printing the command itself before executing it. This can help keep the output clean and focused on the results of the commands rather than the commands themselves.

# Purpose:
# By default, Make uses `/bin/sh` to execute commands in the Makefile. However, some scripts or commands
# might require features specific to `bash` that are not available in `sh`.
# The `SHELL := $(shell which bash)` line sets the shell to `bash` by using the `which` command to find
# the path to the `bash` executable.
#
# This ensures that all commands in the Makefile are executed using `bash`, allowing you to utilize
# `bash`-specific features and syntax. This can be particularly useful for complex scripts that rely on
# `bash` functionalities such as arrays, advanced string manipulation, and other built-in commands.
# Shell to use for running scripts
# SHELL := $(shell which bash)
SHELL := $(shell which sh)
# @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(COLOR_GREEN)%s$(COLOR_RESET) : %s\n", $$1, $$2}' one Makefile
# @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "} {gsub(/^[^:]*:/, ""); gsub(/^ +| +$$/, "", $$1); printf "$(COLOR_GREEN)%-30s$(COLOR_RESET) : %s\n", $$1, $$2}' many Makefile
# -30 is like a padding or \t
# -10 is like a padding or \t

# Avoid the use of . in the target names, as it can cause unexpected behavior in Makefiles. Use / instead of . to separate target names and sub-targets as namespaces.

.PHONY: create_env_file
create_env_file: ## 📝 Create a new .env file from the example file.
	@$(call print_message, "creating .env file")
	@if [ -f .env ]; then \
		$(call print_message, ".env file already exists", "warn"); \
	else \
		$(call print_message, "creating .env file"); \
		cp .env.example .env; \
	fi;

.PHONY: help
help: ## 📋 Display this help message with descriptions of all available commands.
	@echo "Recommended usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z0-9\/_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "} {gsub(/^[^:]*:/, ""); gsub(/^ +| +$$/, "", $$1); printf "'${COLOR_GREEN}'%-10s'${COLOR_RESET}' : %s\n", $$1, $$2}'

.PHONY: globals
globals: ## 🌐 Install all global dependencies required for the project.
	@$(call print_message, "installing global dependencies")
	@pnpm add -g \
		commitizen \
		cz-git \
		czg \
		npm-check-updates \
		eslint \
		oxlint \
		release-please
# $ czg ia --api-key=
# czg # /Users/[user]/.config/.czrc
.PHONY: update
update: ## ⬆️ Update all project dependencies to their latest versions.
	@$(call print_message, "updating dependencies")
	@ncu -u
	@corepack up
	@NODE_ENV= pnpm install
	@NODE_ENV= pnpm audit --fix

.PHONY: setup/vscode
setup/vscode: ## ⚙️ Setup the Visual Studio Code workspace.
## on $(shell pwd)
	@$(call print_message, "setup vscode workspace")
	@$(call vscode)

.PHONY: setup/git
setup/git: ## ⚙️ Setup the Git repository.
	@$(call print_message, "setting up git repository")
# @git config --local core.editor cat
# @git config --local --unset core.editor
# . ./.env;
# TODO: Make this a bash function
# @$(call load_env, $(current_work_directory))
# echo "$(current_work_directory)";
	@echo "$(current_work_directory)"; \
	git config --local user.name "$${GIT_NAME}"; \
	git config --local user.email "$${GIT_EMAIL}"; \
	git config --local user.signingkey "$${GIT_SIGNINGKEY}"; \
	git config --local gpg.program "$${GPG_PATH}"; \
	git config --local commit.gpgsign true; \
	git config --local tag.gpgsign true; \
	git config --local log.showSignature true; \
	git config --local --list

.PHONY: setup/atlas/login
setup/atlas/login: ## ⚙️ Setup the Atlas login.
	@$(call print_message, "setting up atlas login")
	@atlas --profile ${ATLAS_PROFILE} auth login
.PHONY: setup/atlas/global
setup/atlas/global: ## ⚙️ Setup the Atlas global configuration.
	@$(call print_message, "setting up atlas global configuration")
	atlas --profile ${ATLAS_PROFILE} accessList create --currentIp --type ipAddress --projectId ${ATLAS_GLOBAL_ID} --comment "${ATLAS_USERNAME}" --output json
.PHONY: setup/atlas/riot
setup/atlas/riot: ## ⚙️ Setup the Atlas Riot configuration.
	@$(call print_message, "setting up atlas riot configuration")
	atlas --profile ${ATLAS_PROFILE} accessList create --currentIp --type ipAddress --projectId ${ATLAS_RIOT_ID} --comment "${ATLAS_USERNAME}" --output json
.PHONY: build.elb
build/elb: ## 📦 Build and package the Elastic Beanstalk application.
	@rm -Rf ./ts_fastify_template
	@node --run build
	@zip -r ts_fastify_template ./dist ./package.json ./.platform ./.ebextensions ./.env

.PHONY: test
## test is a target and from test to the end is a rule
test: ## 🧪 Run all tests for the project.
	@$(call print_message, "running tests")
	@node --run test

.PHONY: show.versions
show/versions: ## 📊 Display all dependency versions for the project.
	@$(call print_message, "showing dependency versions")
	@echo "node $$(node -v)"
	@echo "npm $$(npm -v)"
	@echo "pnpm $$(pnpm -v)"
show/git:
	@$(call print_message, "showing git version")
	@git --version
	@git config --local --list
.PHONY: package.clean
package/clean: ## 🧹 Clean up the project by removing all generated files and directories.
	@$(call print_message, "cleaning up project")
	@rm -Rf ./node_modules package-lock.json bun.lockb pnpm-lock.yaml

# namespaces
.PHONY: optimize
optimize: ## 🚀 Optimize the project for production.
	@make optimize/images
	@make optimize/videos
	@make optimize/css
	@make optimize/js
.PHONY: optimize/images
optimize/images: ## 🚀 Optimize all images in the project.
	@echo "Optimizing images..."
.PHONY: optimize/videos
optimize/videos: ## 🚀 Optimize all videos in the project.
	@echo "Optimizing videos..."
.PHONY: optimize/css
optimize/css: ## 🚀 Optimize all CSS files in the project.
	@echo "Optimizing CSS..."
.PHONY: optimize/js
optimize/js: ## 🚀 Optimize all JavaScript files in the project.
	@echo "Optimizing JavaScript..."

.PHONY: deps-install
# deps-install: ## 📦 Install all project dependencies.
# 	CMD=install
deps-install: CMD=install
.PHONY: deps-update
# deps-update: ## ⬆️ Update all project dependencies to their latest versions.
# 	CMD=update
deps-update: CMD=update
.PHONY: deps-require
# deps-require: ## 📦 Install a specific package as a project dependency.
# 	CMD=require $(package)
deps-require: CMD=require $(package)

deps-install deps-update deps-require: ## 📦 Install all project dependencies.
	@echo "$(CMD)"

# build install deps start/stop

# atlas auth login
# atlas projects list
# atlas config set project_id ${ATLAS_PROJECT_ID}
# atlas clusters connect ?
# atlas accessList create --currentIp --type ipAddress --projectId ${ATLAS_PROJECT_ID} --comment "Opening Network Access" --deleteAfter $EXPIRATON --output json
# atlas accessList create --currentIp --type ipAddress --projectId ${ATLAS_PROJECT_ID} --comment "${ATLAS_USERNAME}" --output json

# atlas config init --profile ${ATLAS_PROFILE}
# atlas --profile ${ATLAS_PROFILE} auth login
# atlas --profile ${ATLAS_PROFILE} clusters list
# atlas --profile ${ATLAS_PROFILE} projects list
# atlas --profile ${ATLAS_PROFILE} accessList create --currentIp --type ipAddress --projectId ${ATLAS_PROJECT_ID} --comment "${ATLAS_USERNAME}" --output json
#
#
# atlas --profile <ProfileName> clusters connect <ClusterName>

# clean: ## Clean up the project
# 	@echo "Cleaning up..."

# build: ## Build the project
# 	@echo "Building docker images..."

# deps: ## Check for docker and docker-compose
# ifndef DOCKER
# 	@echo "Docker is not available. Please install docker"
# 	@exit 1
# endif
# ifndef DOCKER_COMPOSE
# 	@echo "docker-compose is not available. Please install docker-compose"
# 	@exit 1
# endif
# 	@echo "All dependencies are installed."
