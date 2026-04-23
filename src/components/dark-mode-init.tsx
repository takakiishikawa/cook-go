export function DarkModeInit() {
  const script = `(function(){
    function applyTheme(m){
      if(m==='dark') document.documentElement.classList.add('dark');
      else if(m==='light') document.documentElement.classList.remove('dark');
      else document.documentElement.classList.remove('dark');
    }
    var t=localStorage.getItem('theme')||'light';
    applyTheme(t);
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
