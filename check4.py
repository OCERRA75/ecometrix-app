content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
import re
# Find all span tags and check for broken ones
spans = [(m.start(), m.group()) for m in re.finditer(r'<span[^>]*>[^<]*</span>', content)]
for pos, span in spans:
    line_num = content[:pos].count('\n') + 1
    if any(c in span for c in ['\x00', '\xfe', '\xff']) or len(span) > 200:
        print(f'L{line_num}: {repr(span[:100])}')
# Also show lines 95-102
lines = content.split('\n')
for i in range(94, 104):
    print(f'{i}: {repr(lines[i])}')
