import re
content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
# Replace corrupt comment decorators with clean ones
content = re.sub(r'// [^\w\s\'"{(<\[/]+', '// ', content)
open('src/pages/Dashboard360.jsx', 'w', encoding='utf-8').write(content)
print('Done')
