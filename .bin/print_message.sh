#!/usr/bin/env sh

# . "$(dirname "$0")/colors.sh"
# . "$(dirname "$0")/timestamp.sh"

# echo $(dirname)

# Function to print messages with color and timestamp
function print_message() {
    message="$1"
    type="$2"

    # Default to "success" if type is not provided
    if [ -z "$type" ]; then
        type="success"
    fi

    # Print the message with the appropriate color
    case "$type" in
        "error")
            printf "${COLOR_RED}$(timestamp) %s${COLOR_RESET}\n" "$message"
            ;;
        "success")
            printf "${COLOR_YELLOW}$(timestamp) %s${COLOR_RESET}\n" "$message"
            ;;
        "warn")
            printf "${COLOR_YELLOW}$(timestamp) %s${COLOR_RESET}\n" "$message"
            ;;
    esac
}

# Export the function
export -f print_message
