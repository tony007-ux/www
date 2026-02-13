'use client';

import { useEffect } from 'react';
import { getTheme } from '@/lib/storage';

export default function ThemeInit() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', getTheme());
  }, []);
  return null;
}
