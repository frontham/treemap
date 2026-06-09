import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function makeIcon(path: ReactNode) {
  return function Icon({ size = 16, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {path}
      </svg>
    );
  };
}

export const PlusIcon = makeIcon(<path d="M12 5v14M5 12h14" />);

export const SearchIcon = makeIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
);

export const ChevronDownIcon = makeIcon(<path d="m6 9 6 6 6-6" />);

export const LocateIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </>,
);

export const LayersIcon = makeIcon(
  <>
    <path d="m12 2 10 6-10 6L2 8l10-6Z" />
    <path d="m2 14 10 6 10-6" />
  </>,
);

export const MapIcon = makeIcon(
  <>
    <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" />
    <path d="M9 4v16M15 6v16" />
  </>,
);

export const MoreIcon = makeIcon(<path d="M4 7h16M4 12h16M4 17h16" />);

export const FiltersIcon = makeIcon(<path d="M3 6h18M6 12h12M10 18h4" />);

export const CloseIcon = makeIcon(<path d="M18 6 6 18M6 6l12 12" />);

export const HistoryIcon = makeIcon(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  </>,
);

export const EditIcon = makeIcon(
  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />,
);

export const TrashIcon = makeIcon(
  <>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </>,
);

export const UserIcon = makeIcon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
  </>,
);

export const TreeIcon = makeIcon(
  <>
    <path d="M12 22v-7" />
    <path d="M9 15c-3 0-5-2-5-5 0-2 1-3 2-3 0-2 2-4 4-4s4 2 4 4c0 0 1-1 2-1 2 0 3 2 3 4s-1 5-5 5H9Z" />
  </>,
);
