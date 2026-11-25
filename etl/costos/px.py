import re,html,sys
# usage: px.py file [regex] [ctx]
t=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
t=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S|re.I)
t=html.unescape(re.sub(r'<[^>]+>',' ',t)); t=re.sub(r'\s+',' ',t)
pat=sys.argv[2] if len(sys.argv)>2 else r'S/ ?[0-9]|US\$ ?[0-9]|USD ?[0-9]|Inversi|Duraci'
c=int(sys.argv[3]) if len(sys.argv)>3 else 150
seen=0
for m in re.finditer(pat,t,flags=re.I):
    s=max(0,m.start()-c); print('-',t[s:m.end()+c]); seen+=1
    if seen>15: break
if not seen: print('NOHIT len',len(t))
