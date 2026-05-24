content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
# Replace the entire problematic span with a clean SVG checkmark
old = '<span className="text-brand-400 text-lg">\u2713</span>'
new = '<svg className="w-5 h-5 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg>'
if old in content:
    content = content.replace(old, new)
    print('Fixed checkmark span')
else:
    # Try finding it differently
    import re
    pattern = r'<span className="text-brand-400 text-lg">[^<]*</span>'
    match = re.search(pattern, content)
    if match:
        print('Found:', repr(match.group()))
        content = re.sub(pattern, new, content)
        print('Fixed via regex')
    else:
        print('NOT FOUND - checking nearby')
        idx = content.find('text-brand-400 text-lg')
        print(repr(content[idx-5:idx+60]))
open('src/pages/Dashboard360.jsx', 'w', encoding='utf-8').write(content)
print('Done')
