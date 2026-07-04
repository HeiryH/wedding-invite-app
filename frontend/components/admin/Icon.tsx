'use client';
// Compatibility shim — maps old admin icon names to Convive icon names.
// New code should import directly from '@/components/ui/Icon'.

import { Icon as DSIcon } from '@/components/ui/Icon';
import React from 'react';

const NAME_MAP: Record<string, string> = {
  'cast-out':        'log-out',
  'xmark':           'x',
  'nav-arrow-left':  'arrow-left',
  'nav-arrow-right': 'arrow-right',
  'arrow-up':        'arrow-right',
  'user-plus':       'users',
  'design-nib':      'palette',
  'sparks':          'sparkles',
  'home-simple':     'home',
  'group':           'users',
  'pause':           'minus',
  'play':            'check',
  'bolt':            'sparkles',
  'circle-check':    'check-circle',
  'circle-x':        'x',
};

interface OldIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

export default function Icon({ name, ...rest }: OldIconProps) {
  const resolved = NAME_MAP[name] ?? name;
  return <DSIcon name={resolved} {...rest} />;
}
