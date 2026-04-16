print_pokemon() {
  local character
  local forms
  local has_forms
  local form

  character=$(pokemon-go-colorscripts --list | shuf -n 1)
  forms=$(pokemon-go-colorscripts --name "$character" --form USE_INCORRECT_FORM_NAME_TO_LIST_AVAILABLE_FORMS | tail -n +2)
  has_forms=$(($(echo "$forms" | wc -l) > 0))
  form=$(echo "$forms" | shuf -n 1)

  if [[ $has_forms -eq 1 ]]; then
    pokemon-go-colorscripts --name "$character" --form "$form"
  else
    pokemon-go-colorscripts --name "$character"
  fi
}

if [[ -t 1 ]] && command -v pokemon-go-colorscripts >/dev/null 2>&1; then
  print_pokemon | tail -n +2
fi
