nvm_get_arch() {
    case "${OSINFO_PLATFORM}_${OSINFO_NAME}" in
        linux_alpine)
            nvm_echo "${OSINFO_PROCESSOR}-musl"
            ;;
        *)
            nvm_echo "${OSINFO_PROCESSOR}";;
    esac
}
