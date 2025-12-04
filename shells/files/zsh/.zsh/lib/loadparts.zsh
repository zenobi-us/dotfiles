#!/usr/bin/env zsh

function load-parts {
	local root="${1}"
	local pattern="${2}"
	local verbose="${DOTFILE_VERBOSE:-0}"
	local errors=()

	if [[ -z "$root" || -z "$pattern" ]]; then
		echo "load-parts: root and pattern required" >&2
		return 1
	fi

	# Print header based on verbosity
	if ((verbose >= 2)); then
		echo "> ${pattern}"
	elif ((verbose == 1)); then
		echo -n "> ${pattern} "
	fi

	# Load all matching parts
	for part in $(find -L "$root" -path "*/${pattern}.zsh" | sort -z); do
		if [[ -e "${part}" ]]; then
			if ((verbose >= 2)); then
				echo "  loading: ${part}"
			elif ((verbose == 1)); then
				echo -n "."
			fi

			# Capture errors
			if ! source "${part}" 2>&1; then
				errors+=("${part}")
			fi
		fi
	done

	# Print newline for verbose mode 1
	((verbose == 0)) && {
		return
	}

	# Print errors at the end
	if ((${#errors[@]} > 0)); then
		echo ""
		echo "Errors loading parts for pattern: ${pattern}"
		for error in "${errors[@]}"; do
			echo "  - ${error}"
		done
		return 1
	fi
}
