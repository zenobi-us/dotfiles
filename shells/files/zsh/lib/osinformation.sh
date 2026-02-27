#!/bin/sh

. "${DOTFILE_ROOT}/lib/case.sh"

#
# Environment Information
#
get_machine_os() {
	os=$(tolowercase "$(uname -s )")
	case "${os}" in
	darwin*)
		echo "darwin"
		return 0
		;;
	linux*)
		echo "linux"
		return 0
		;;
	*)
		# dump error to stderr
		echo "$os is not supported" >&2
		exit 1
		;;
	esac
}

get_machine_processor() {
	BRAND_STRING="$(sysctl -e -n machdep.cpu.brand_string)"
	# if brand string contains Apple, then it's an M1
	case "${BRAND_STRING}" in
	*Apple*)
		echo 'm1'
		return 0
		;;
	*)
		uname -m
		return 0
		;;
	esac
}

MACHINE_OS=$(get_machine_os)
MACHINE_PROCESSOR=$(get_machine_processor)

export MACHINE_OS
export MACHINE_PROCESSOR
