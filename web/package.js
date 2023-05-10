const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

let f = readFileSync(join(__dirname, 'index.html')).toString();
f = f
    .replace(
        '<script src="./dist/index.js"></script>',
        () =>
            '<script>' +
            readFileSync(join(__dirname, 'dist/index.js'))
                .toString()
                .replaceAll('</script', '</sc\\ipt') +
            '</script>'
    )
    .replace(
        '<link rel="stylesheet" href="./styles.css" />',
        () =>
            '<style>' +
            readFileSync(join(__dirname, 'styles.css'))
                .toString()
                .replaceAll(/(  +)|\n/g, '')
                .replaceAll(/: +/g, ':')
                .replaceAll(/, +/g, ',')
                .replaceAll(/ +> +/g, '>')
                .replaceAll(/ \{+/g, '{')
                .replaceAll(
                    'url(./pixeloid.ttf)',
                    `url(data:font/ttf;base64,${readFileSync(
                        join(__dirname, 'pixeloid.ttf')
                    ).toString('base64')})`
                )
                .replaceAll(
                    'url(./pixeloid.ttf)',
                    `url(data:font/ttf;base64,${readFileSync(
                        join(__dirname, 'pixeloid.ttf')
                    ).toString('base64')})`
                )
                .replaceAll(
                    'url(./rainbow32-font.ttf)',
                    `url(data:font/ttf;base64,${readFileSync(
                        join(__dirname, 'rainbow32-font.ttf')
                    ).toString('base64')})`
                ) +
            '</style>'
    );
writeFileSync(join(__dirname, 'packaged.html'), f);
