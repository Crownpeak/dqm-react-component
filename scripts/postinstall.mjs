import { execSync } from "node:child_process";
import { isWebContainer } from "@webcontainer/env";

if (isWebContainer()) {
  console.log("[postinstall] WebContainer/StackBlitz erkannt → build wird ausgeführt…");
  execSync("npm run build", { stdio: "inherit" });
} else {
  console.log("[postinstall] Kein WebContainer → build wird übersprungen.");
}
