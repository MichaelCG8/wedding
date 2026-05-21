// Encrypts details.html -> details.html.encrypted using AES-256-GCM with
// a PBKDF2-derived key. The output format matches what the browser expects
// in index.html's bank-details modal:
//   base64( salt[16] | iv[12] | ciphertext+tag )

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const INPUT = 'details.html';
const OUTPUT = 'details.html.encrypted';
const ITERATIONS = 250000;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;

function promptHidden(question) {
    return new Promise(function (resolve) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        rl.question(question, function (answer) {
            rl.close();
            process.stdout.write('\n');
            resolve(answer);
        });
        rl._writeToOutput = function (str) {
            if (str === question) rl.output.write(str);
        };
    });
}

(async function () {
    if (!fs.existsSync(INPUT)) {
        console.error('Error: ' + INPUT + ' not found.');
        process.exit(1);
    }

    const passcode = await promptHidden('Passcode: ');
    if (!passcode) {
        console.error('Error: passcode required.');
        process.exit(1);
    }
    const confirm = await promptHidden('Confirm passcode: ');
    if (confirm !== passcode) {
        console.error('Error: passcodes do not match.');
        process.exit(1);
    }

    const plaintext = fs.readFileSync(INPUT);
    const salt = crypto.randomBytes(SALT_LEN);
    const iv = crypto.randomBytes(IV_LEN);
    const key = crypto.pbkdf2Sync(passcode, salt, ITERATIONS, KEY_LEN, 'sha256');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    const blob = Buffer.concat([salt, iv, ciphertext, tag]);
    fs.writeFileSync(OUTPUT, blob.toString('base64') + '\n');

    console.log('Wrote ' + OUTPUT + ' (' + blob.length + ' bytes).');
})();
