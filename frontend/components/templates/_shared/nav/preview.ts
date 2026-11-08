'use client';

import { createContext } from 'react';

export const NavigationAdjustPreview = createContext<'available' | 'selected' | undefined>(undefined);
