'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    const isLightTheme = window.localStorage.getItem('@FinanFamily:theme') === 'light';
    document.documentElement.classList.toggle('theme-light', isLightTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      isLightTheme ? '#f8fafc' : '#020617'
    );
  }, []);

  return null;
}
