import fs from "fs";
import path from "path";

function copyFolderSync(from: string, to: string): number {
  if (!fs.existsSync(from)) return 0;
  let copiedCount = 0;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copiedCount += copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
      copiedCount++;
    }
  });
  return copiedCount;
}

function main() {
  const srcDir = path.join(process.cwd(), "images");
  const destDir = path.join(process.cwd(), "public", "images");

  if (!fs.existsSync(srcDir)) {
    console.log("[-] Source images directory does not exist at root.");
    return;
  }

  console.log(`[+] Synchronizing images from ${srcDir} to ${destDir}...`);
  
  // List subdirectories (brands) in root images
  const brands = fs.readdirSync(srcDir).filter(f => fs.lstatSync(path.join(srcDir, f)).isDirectory());
  
  let totalCopied = 0;
  for (const brand of brands) {
    const brandSrc = path.join(srcDir, brand);
    const brandDest = path.join(destDir, brand);
    const brandCopied = copyFolderSync(brandSrc, brandDest);
    console.log(`    -> Syncing brand: ${brand} (${brandCopied} files)`);
    totalCopied += brandCopied;
  }

  console.log(`\n[✓] Image synchronization complete! Total copied: ${totalCopied} files.`);
}

main();
