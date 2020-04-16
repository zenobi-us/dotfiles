function global:mankind-divided-disable-intro-videos (
  [string] $gamedir = $(throw "-gamedir is required."),
  [string] $replacement = "32D9BE50C4186564445921C6B31C65BD.pc_binkvid"
) {
  [string] $target = "$gamedir/disabled-intro-videos";
  [string] $root = "$gamedir/runtime";
  [string] $replaceWith = "$root/$replacement";
  [string[]] $source = @(
    "$root/A25DE802B5F763BC2E933535CD9DC727.pc_binkvid",
    "$root/5ED546466C171E858CC5A68F29A23284.pc_binkvid",
    "$root/4A0E2951DDC2FCAAB24181DC99805D79.pc_binkvid",
    "$root/61F7622A655F804A87F7991025FADC0C.pc_binkvid",
    "$root/CA6F14742B3E9F4540E4AEA8826D4BA8.pc_binkvid",
    "$root/D6303B081E3752D30912AD69F480282D.pc_binkvid"
  );

  mkdir "$target";
  foreach ($item in $source) {
    move-item -path $item -destination $target;
    copy-item -path $replaceWith -destination $item;
  }

}

