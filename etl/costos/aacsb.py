import re,html,sys
t=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
t=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S)
t=html.unescape(re.sub(r'<[^>]+>',' ',t)); t=re.sub(r'\s+',' ',t)
i=t.find("Tuition Type"); s=t[i:]
s=re.sub(r'((Fully face-to-face|Hybrid|Fully online) [0-9,]+ USD [A-Za-z\-, ]*?Time )(\1)+',r'\1 ',s)
print(s[:3500])
