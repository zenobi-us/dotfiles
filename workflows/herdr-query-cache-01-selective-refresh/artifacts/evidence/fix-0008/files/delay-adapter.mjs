import { appendFileSync, existsSync } from 'node:fs';
const args=process.argv.slice(2);
appendFileSync("/tmp/herdr-fix-0008-EFevpz/native-calls.jsonl",JSON.stringify({at:Date.now(),args})+'\n');
if(args[0]==='job-run') { const end=Date.now()+180000; while(!existsSync("/tmp/herdr-fix-0008-EFevpz/validate-go")&&Date.now()<end) await Bun.sleep(100); }
const p=Bun.spawn(["/home/zenobius/.local/share/mise/installs/bun/latest/bin/bun","/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs",...args],{stdin:'inherit',stdout:'pipe',stderr:'inherit'});
const stdout=await new Response(p.stdout).text(), code=await p.exited;
appendFileSync("/tmp/herdr-fix-0008-EFevpz/native-results.jsonl",JSON.stringify({at:Date.now(),args,stdout,code})+'\n');
process.stdout.write(stdout); process.exit(code);
