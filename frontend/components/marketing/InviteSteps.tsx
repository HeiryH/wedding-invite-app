import Image from 'next/image';
import { INVITE_STEPS } from '@/lib/landing/defaults';
import styles from './InviteSteps.module.css';

export function InviteStepArt({ step, imageUrl }: { step: (typeof INVITE_STEPS)[number]; imageUrl?: string }) {
  return imageUrl ? (
    <div className={`${styles.art} ${styles.customArt}`} aria-hidden="true">
      <Image src={imageUrl} alt="" fill unoptimized style={{ objectFit: 'contain' }} />
    </div>
  ) : <div className={`${styles.art} ${styles[step]}`} aria-hidden="true" />;
}

export function InviteSteps({ copy, padding }: { copy: (key: string) => string; padding: string }) {
  const subtitle = copy('steps.subtitle');

  return (
    <section id="features" aria-labelledby="invite-steps-title" className={styles.section} style={{ padding }}>
      <div className={styles.inner}>
        <h2 id="invite-steps-title">{copy('steps.title')}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <ol className={styles.steps} role="list">
          {INVITE_STEPS.map((step) => (
            <li key={step} data-step={step} className={styles.step}>
              <InviteStepArt step={step} imageUrl={copy(`steps.${step}.image`)} />
              <h3>{copy(`steps.${step}.title`)}</h3>
              <p>{copy(`steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
