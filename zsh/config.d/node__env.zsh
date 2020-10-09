case "${OSINFO_PLATFORM}_${OSINFO_NAME}" in
    linux_alpine)
        export NVM_NODEJS_ORG_MIRROR=https://unofficial-builds.nodejs.org/download/release
        export NVM_IOJS_ORG_MIRROR=https://example.com
        ;;
    *)
        ;;
esac