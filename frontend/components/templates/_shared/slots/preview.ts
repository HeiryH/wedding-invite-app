'use client';

import { createContext } from 'react';

/** Only set by the Studio preview. Public forms use normal browser validation. */
export const MasterPreviewContext = createContext(false);

/** The editor can preview table selection without submitting the RSVP form first. */
export const SeatingPreviewContext = createContext<{ dismiss: () => void } | null>(null);
