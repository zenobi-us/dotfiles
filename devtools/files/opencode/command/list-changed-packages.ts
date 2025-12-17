import { Glob } from "bun";
import { execSync } from "child_process";
import { readFileSync } from "fs";

// Get all package.json files
const glob = new Glob("**/package.json");
const pkgFiles: string[] = [];
for await (const file of glob.scan(".")) {
  pkgFiles.push(file);
}

// Get changed files from git
const changedFiles = execSync("git diff --name-only master...HEAD")
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean);

// Find intersection: package.json files that are in changed directories
const changedPkgs = new Map<string, string>();

for (const pkgFile of pkgFiles) {
  // Extract directory from package.json path
  const pkgDir = pkgFile.split("/").slice(0, -1).join("/");
  
  // Check if any changed file is in this package directory
  const hasChanges = changedFiles.some(file => file.startsWith(pkgDir + "/"));
  
  if (hasChanges) {
    try {
      const pkgJson = JSON.parse(readFileSync(pkgFile, "utf-8"));
      const pkgName = pkgJson.name || pkgDir;
      changedPkgs.set(pkgName, pkgDir);
    } catch (e) {
      changedPkgs.set(pkgDir, pkgDir);
    }
  }
}

// Print changed package names
changedPkgs.forEach((_, name) => {
  console.log(name);
});
