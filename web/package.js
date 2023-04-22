const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

let f = readFileSync(join(__dirname, 'index.html')).toString();
f = f
    .replace(
        '<script src="./dist/index.js"></script>',
        '<script>' +
            readFileSync(join(__dirname, 'dist/index.js'))
                .toString()
                .replaceAll('</script', '</sc\\ipt') +
            '</script>'
    )
    .replace(
        '<link rel="stylesheet" href="./styles.css" />',
        '<style>' +
            readFileSync(join(__dirname, 'styles.css'))
                .toString()
                .replaceAll(/(  +)|\n/g, '')
                .replaceAll(/: +/g, ':')
                .replaceAll(/, +/g, ',')
                .replaceAll(/ +> +/g, '>')
                .replaceAll(/ \{+/g, '{') +
            '</style>'
    );
writeFileSync(join(__dirname, 'packaged.html'), f);
