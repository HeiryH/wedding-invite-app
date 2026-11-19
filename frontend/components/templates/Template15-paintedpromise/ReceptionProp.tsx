import styles from './Template15.module.css';
import { receptionArtworkFrame, RECEPTION_SPRITES } from './data/reception';
import { useAssetSurface, type AssetSurface } from '../_shared/cinematic/useAssetSurface';

type ReceptionPropKind = keyof typeof RECEPTION_SPRITES;

export default function ReceptionProp({ kind, open, artworkFrame, arrived, editing, available, fire, surface }: {
  kind: ReceptionPropKind;
  open: number;
  artworkFrame?: number;
  arrived: boolean;
  editing: boolean;
  available: boolean;
  fire: () => void;
  surface?: AssetSurface;
}) {
  const image = receptionArtworkFrame(kind, artworkFrame ?? open);
  const active = available && arrived && !editing;
  const { ref: surfaceRef, style: surfaceStyle } = useAssetSurface<HTMLSpanElement>(surface, active);
  const label = kind === 'rsvp-guest-book' ? 'Open RSVP form' : 'Write your best wishes';
  const artwork = <span ref={surfaceRef} className={styles.receptionSprite}
    data-reception-frame={image.frame}
    style={{ ...image.style, ...surfaceStyle }} />;

  return active
    ? <button type="button" className={styles.receptionProp} aria-label={label} onClick={fire}>{artwork}</button>
    : <div className={styles.receptionProp}>{artwork}</div>;
}
