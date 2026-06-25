import re
content = open('src/lib/i18n.js', encoding='utf-8').read()
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if re.search(r":\s*'[^'\\\\]*[a-zA-Z]['][a-zA-Z][^']*'", line):
        print(f'L{i}: {line.strip()[:120]}')
