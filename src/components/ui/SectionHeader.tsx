import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface Props {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  center?: boolean;
}

/** Consistent section heading: mono index + eyebrow, H2, optional lead paragraph. */
export function SectionHeader({ index, eyebrow, title, lead, id, center }: Props) {
  return (
    <Reveal className={`section-header${center ? ' is-center' : ''}`}>
      <p className="eyebrow">
        <span className="eyebrow-index" dir="ltr">
          {index}
        </span>
        <span className="eyebrow-line" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {lead && <p className="section-lead">{lead}</p>}
    </Reveal>
  );
}
