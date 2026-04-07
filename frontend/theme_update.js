import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.resolve(__dirname, 'src');

function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        const fullPath = path.join(currentDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Replace rounding for sharp aesthetics
            content = content.replace(/rounded-3xl|rounded-2xl|rounded-xl|rounded-lg/g, 'rounded-sm');
            content = content.replace(/rounded-full/g, 'rounded-sm'); 
            
            // Keep circular items like letters in avatars 
            // Wait, changing rounded-full might break avatars. Instead of guessing, let's just make everything "sharp css" as requested
            content = content.replace(/animate-spin rounded-sm/g, 'animate-spin rounded-full');

            // Replace colors for warm aesthetic
            content = content.replace(/indigo-/g, 'rose-');
            content = content.replace(/blue-/g, 'amber-');

            // Branding text
            content = content.replace(/'Task Manager'/g, "'RS.ONLINE'");
            content = content.replace(/>Task Manager</g, ">RS.ONLINE<");
            content = content.replace(/>TM</g, ">RS<");
            content = content.replace(/>Internal System</g, ">Internal Network<");

            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
}

traverse(dir);

// Also index.html
const indexPath = path.resolve(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(/Task Manager/g, 'RS.ONLINE');
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Updated index.html');
}
