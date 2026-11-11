# Run Home Assistant commands with the token from the vault's fnox profile.
# Set HASS_SERVER to a validated HTTPS endpoint or encrypted tunnel first.
# Usage: hass_local config release
hass_local() {
	if [[ -z "${HASS_SERVER:-}" ]]; then
		print -u2 -- "hass_local: set HASS_SERVER to the protected Home Assistant endpoint."
		return 1
	fi

	HASS_SERVER="$HASS_SERVER" command mise exec fnox@1.47.0 -- fnox \
		--config "$HOME/.vaultfiles/fnox.toml" \
		--profile homeassistant \
		--no-defaults \
		--no-daemon \
		--if-missing error \
		exec -- uvx --from homeassistant-cli==1.0.0 hass-cli "$@"
}
