class NavigationSync { constructor(map = {}, scroller = null) { this.map = map; this.scroller = scroller || ((el) => el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })); } go(key) { const target = this.map[key]; if (target) this.scroller(target); return target; } bind(menuRoot) { menuRoot?.addEventListener?.('click', (event) => { const key = event.target?.dataset?.preview; if (key) this.go(key); }); return this; } }
if (typeof module !== 'undefined') module.exports = { NavigationSync };
if (typeof window !== 'undefined') window.NavigationSync = NavigationSync;
