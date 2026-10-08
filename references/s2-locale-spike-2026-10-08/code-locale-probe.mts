import { createAstroRenderer } from "astro-expressive-code";
import { pluginCollapsible } from "expressive-code-collapsible";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginLanguageBadge } from "expressive-code-language-badge";
import { expressiveCodeConfig } from "../../src/config";
import I18nKey from "../../src/i18n/i18nKey";
import { i18n } from "../../src/i18n/translation";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const config = expressiveCodeConfig.pluginCollapsible!;
const renderer = await createAstroRenderer({
 astroConfig:{base:"/Zhenkun-blog-site/",root:pathToFileURL(process.cwd()+"/"),srcDir:pathToFileURL(process.cwd()+"/src/")},
 ecConfig:{
  themes:[expressiveCodeConfig.darkTheme,expressiveCodeConfig.lightTheme],
  useDarkModeMediaQuery:false,
  plugins:[pluginLanguageBadge(),pluginCollapsibleSections(),pluginLineNumbers(),pluginCollapsible({
   lineThreshold:config.lineThreshold ||15,previewLines:config.previewLines ||8,defaultCollapsed:config.defaultCollapsed ??true,
   expandButtonText:i18n(I18nKey.codeCollapsibleShowMore),collapseButtonText:i18n(I18nKey.codeCollapsibleShowLess),
   expandedAnnouncement:i18n(I18nKey.codeCollapsibleExpanded),collapsedAnnouncement:i18n(I18nKey.codeCollapsibleCollapsed),
  })],
 }
});
function visible(node:any):any{
 const own=node.type==="element"?{tag:node.tagName,attrs:node.properties||{}}:node.type==="text"?{text:node.value}:{};
 return {...own,...(node.children?{children:node.children.map(visible)}:{})};
}
const code=Array.from({length:20},(_,i)=>"const value"+i+" = "+i+";").join("\n");
const results=await Promise.all(["zh-CN","en","en","zh-CN"].map(async(locale,index)=>{
 const {renderedGroupAst}=await renderer.ec.render({code,language:"javascript",locale,meta:'title="sample.js"'});
 const ast=visible(renderedGroupAst);
 return {index,locale,ast};
}));
writeFileSync("tmp/s2-20261008/code-locale-probe.json",JSON.stringify({kind:"ACTUAL_CONFIGURED_RENDERER_SEAM_ONLY",wholeSiteAcceptance:false,source:"a7b31c777f415e725eaf4d280da34380b3fc82cd",results},null,2)+"\n");
for(const r of results){
 const texts:any[]=[];function collect(n:any){if(n.attrs &&(/copy|collapse/.test(JSON.stringify(n.attrs))))texts.push({tag:n.tag,attrs:n.attrs,text:(n.children||[]).filter((x:any)=>x.text).map((x:any)=>x.text).join("")});for(const c of n.children||[])collect(c)}collect(r.ast);
 console.log(JSON.stringify({index:r.index,locale:r.locale,controls:texts}));
}
