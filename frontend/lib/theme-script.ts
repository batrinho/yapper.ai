export const DARK_QUERY = "(prefers-color-scheme: dark)";

export const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem("yapper-prefs")||"{}");var t=s.theme||(matchMedia("${DARK_QUERY}").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}})()`;
