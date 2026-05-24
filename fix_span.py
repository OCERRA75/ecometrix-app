content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
content = content.replace('\u2713an>', '\u2713</span>')
open('src/pages/Dashboard360.jsx', 'w', encoding='utf-8').write(content)
print('Done')
