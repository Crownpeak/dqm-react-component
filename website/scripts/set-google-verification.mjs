import fs from 'node:fs';

// Load environment variables from .env file
import 'dotenv/config';

if (!process.env.GOOGLE_VERIFICATION) {
  console.error('Error: GOOGLE_VERIFICATION environment variable is not set.');
  process.exit(1);
}

const htmlFilePath = `./public/${process.env.GOOGLE_VERIFICATION}.html`;

// Create the HTML file with the verification content
const fileContent = `google-site-verification: ${process.env.GOOGLE_VERIFICATION}.html`;

fs.writeFileSync(htmlFilePath, fileContent, 'utf8');
console.log(`Created verification file at: ${htmlFilePath}`);
