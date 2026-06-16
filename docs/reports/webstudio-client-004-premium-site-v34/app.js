
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const io = reduce ? null : new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.animate([{opacity:0, transform:'translateY(28px)'},{opacity:1, transform:'translateY(0)'}],{duration:720,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'}); io.unobserve(e.target); } });
},{threshold:.14});
document.querySelectorAll('.card,.flow,.case-panel,.case-image,.cta').forEach(el=>{ if(io) io.observe(el); });
document.querySelectorAll('[data-open-telegram]').forEach(a=>a.addEventListener('click',()=>{ window.__client004CtaClicked = true; }));
