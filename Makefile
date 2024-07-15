current_work_directory := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
include .env
export $(shell sed 's/=.*//' .env)

include ./.bin/colors.sh

include ./.bin/timestamp.mk
include ./.bin/print_message.mk
include ./.bin/vscode.mk

.DEFAULT_GOAL := help

SHELL := $(shell which sh)

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

.PHONY: package/clean
package/clean: ## 🧹 Clean up the project by removing all generated files and directories.
	@$(call print_message, "cleaning up project")
	@rm -Rf ./node_modules package-lock.json bun.lockb pnpm-lock.yaml

.PHONY: package/globals
package/globals: ## 🌐 Install all global dependencies required for the project.
	@$(call print_message, "installing global dependencies")
	@pnpm add -g \
		commitizen \
		cz-git \
		czg \
		npm-check-updates \
		eslint \
		oxlint \
		release-please

.PHONY: package/update
package/update: ## ⬆️ Update all project dependencies to their latest versions.
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
	@echo "$(current_work_directory)"; \
	git config --local user.name "$${GIT_NAME}"; \
	git config --local user.email "$${GIT_EMAIL}"; \
	git config --local user.signingkey "$${GIT_SIGNINGKEY}"; \
	git config --local gpg.program "$${GPG_PATH}"; \
	git config --local commit.gpgsign true; \
	git config --local tag.gpgsign true; \
	git config --local log.showSignature true; \
	git config --local --list

.PHONY: show.versions
show/versions: ## 📊 Display all dependency versions for the project.
	@$(call print_message, "showing dependency versions")
	@echo "node $$(node -v)"
	@echo "npm $$(npm -v)"
	@echo "pnpm $$(pnpm -v)"
