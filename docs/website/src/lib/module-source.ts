export function moduleSource(module: string, path: string): string {
  return (
    "https://github.com/zenobi-us/dotfiles/blob/master/mise/conf.d/" +
    [module, ...path.split("/")].map(encodeURIComponent).join("/")
  );
}
