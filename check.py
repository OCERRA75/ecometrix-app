content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'greenwashing' in line.lower() and ('span' in line or 'div' in line):
        print(f'{i}: {repr(line.strip())}')
