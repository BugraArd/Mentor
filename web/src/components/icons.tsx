import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const defaults: IconProps = { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };

function icon(fn: (p: IconProps) => React.ReactNode, displayName: string) {
  const Icon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...defaults} {...props}>
      {fn(props)}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

export const HomeIcon = icon(
  () => (
    <>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  "HomeIcon"
);

export const BookOpenIcon = icon(
  () => (
    <>
      <path d="M2 4c2-1 4.5-1 6 0s4 1 6 0" />
      <path d="M2 4v14c2-1 4.5-1 6 0s4 1 6 0V4" />
      <path d="M14 4c2-1 4.5-1 6 0s2 0 2 0" />
      <path d="M14 4v14c2-1 4.5-1 6 0s2 0 2 0V4" />
    </>
  ),
  "BookOpenIcon"
);

export const PlusCircleIcon = icon(
  () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  "PlusCircleIcon"
);

export const UsersIcon = icon(
  () => (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  "UsersIcon"
);

export const ClockIcon = icon(
  () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  "ClockIcon"
);

export const CheckCircleIcon = icon(
  () => (
    <>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </>
  ),
  "CheckCircleIcon"
);

export const AlertCircleIcon = icon(
  () => (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  "AlertCircleIcon"
);

export const EditIcon = icon(
  () => (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  "EditIcon"
);

export const ChevronRightIcon = icon(
  () => <path d="M9 18l6-6-6-6" />,
  "ChevronRightIcon"
);

export const SendIcon = icon(
  () => (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  "SendIcon"
);

export const StarIcon = icon(
  () => (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  "StarIcon"
);

export const LockIcon = icon(
  () => (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  "LockIcon"
);

export const ClipboardIcon = icon(
  () => (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </>
  ),
  "ClipboardIcon"
);

export const XIcon = icon(
  () => (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  "XIcon"
);

export const TrashIcon = icon(
  () => (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  "TrashIcon"
);

export const FileTextIcon = icon(
  () => (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <path d="M10 9H8" />
    </>
  ),
  "FileTextIcon"
);

export const ArrowLeftIcon = icon(
  () => (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <path d="M12 19l-7-7 7-7" />
    </>
  ),
  "ArrowLeftIcon"
);

export const BellIcon = icon(
  () => (
    <>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </>
  ),
  "BellIcon"
);

export const SunIcon = icon(
  () => (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  "SunIcon"
);

export const MoonIcon = icon(
  () => <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
  "MoonIcon"
);

export const CopyIcon = icon(
  () => (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </>
  ),
  "CopyIcon"
);
