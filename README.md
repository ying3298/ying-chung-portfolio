# Deploy · ychungworks.com

Drop everything in this folder into the root of `ying3298/ying-chung-portfolio`, commit, push. Vercel deploys it.

| File | What it is |
|---|---|
| `index.html` | The new home: the belief paragraph, music, project pop-ups. |
| `work.html` | Your full portfolio (latest version). Case studies open from here inside the side panel. |
| `img/` · `play/` | Pictures, clips and the two live Fifty Something pieces the home page uses. |
| `assets/dt/` | Four newer Decision Trail clips (replace the old ones). |

`index.html` replaces the current home page. Everything already in `assets/` stays as it is.

**Change a choice later:** open `index.html`, find `window.YING_CONFIG` near the top.
`bar` a–d · `type` plain/inline/index/… · `panel` sheet/split · `introStyle` a–f · `layout` hand-placed Story positions.

**Check after deploy:** open the site on your phone, tap Turn on mic (needs https, which Vercel gives you), open MiMo and Steeped in the side panel.
