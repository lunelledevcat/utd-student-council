// Inline SVG icons (no icon font: nothing extra to load, CSP stays 'self'). 24x24, stroke = currentColor.
type P = React.SVGProps<SVGSVGElement>;
const base = (p: P) => ({ width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const IconFacebook = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M14 8.5V6.8c0-.8.5-1.3 1.4-1.3H17V2.3C16.4 2.2 15.3 2 14.2 2 11.6 2 10 3.6 10 6.4v2.1H7.3V12H10v10h4V12h2.8l.5-3.5H14Z" /></svg>
);
export const IconInstagram = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
);
export const IconSearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base(p)}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>);
export const IconLink = (p: P) => (<svg {...base(p)}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></svg>);
export const IconExternal = (p: P) => (<svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></svg>);
export const IconClose = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconChevronLeft = (p: P) => (<svg {...base(p)}><path d="m15 5-7 7 7 7" /></svg>);
export const IconChevronRight = (p: P) => (<svg {...base(p)}><path d="m9 5 7 7-7 7" /></svg>);
export const IconChevronDown = (p: P) => (<svg {...base(p)}><path d="m5 9 7 7 7-7" /></svg>);
export const IconArrowUp = (p: P) => (<svg {...base(p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>);
export const IconArrowLeft = (p: P) => (<svg {...base(p)}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>);
export const IconCrown = (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19.5 18h-15L3 7.5ZM5 19.5h14V21H5z" /></svg>);
export const IconMedal = (p: P) => (<svg {...base(p)}><path d="M8 2.5h8l-2.5 6h-3L8 2.5Z" /><circle cx="12" cy="15" r="6" /><path d="m12 12 .9 1.9 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2.1-.3L12 12Z" fill="currentColor" stroke="none" /></svg>);
export const IconStar = (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" /></svg>);
export const IconPin = (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M15 3.5 20.5 9l-2 .8-3.4 3.4.4 4.3-1.4 1.4-3.6-3.6L5.5 20.3l-.8-.8 5-5-3.6-3.6 1.4-1.4 4.3.4L15.2 6l-.2-2.5Z" /></svg>);
export const IconMegaphone = (p: P) => (<svg {...base(p)}><path d="M3 10v4h3l7 4.5V5.5L6 10H3Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>);
export const IconImages = (p: P) => (<svg {...base(p)}><rect x="3" y="5" width="15" height="13" rx="2.5" /><path d="m3 15 4-4 4 4 2-2 5 5" /><path d="M7 2.8h12.2A1.8 1.8 0 0 1 21 4.6V15" /></svg>);
export const IconFlag = (p: P) => (<svg {...base(p)}><path d="M5 21V4M5 4h11l-1.8 3.5L16 11H5" /></svg>);
export const IconUsers = (p: P) => (<svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.6" /><path d="M16.5 14.2A5 5 0 0 1 21.5 19" /></svg>);
export const IconTeacher = (p: P) => (<svg {...base(p)}><path d="M2 8.5 12 4l10 4.5-10 4.5L2 8.5Z" /><path d="M6 10.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M22 8.5v5" /></svg>);
export const IconInfo = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>);
export const IconSun = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const IconMoon = (p: P) => (<svg {...base(p)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>);
export const IconExpand = (p: P) => (<svg {...base(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>);
export const IconReset = (p: P) => (<svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 3.5v5h5" /></svg>);
export const IconUser = (p: P) => (<svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);
