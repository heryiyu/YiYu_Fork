const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./jscpd-report/jscpd-report.json', 'utf8'));
const out = data.duplicates.map(d => ({
    format: d.format,
    lines: d.lines,
    file1: `${d.firstFile.name}:${d.firstFile.start}-${d.firstFile.end}`,
    file2: `${d.secondFile.name}:${d.secondFile.start}-${d.secondFile.end}`
}));
console.log(JSON.stringify(out, null, 2));
