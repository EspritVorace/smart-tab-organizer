import React from 'react';
import { getMessage } from '../../../utils/i18n';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

interface HeaderProps {
  settings?: unknown;
}

function Header({ settings: _settings }: HeaderProps) {
  return (
    <header>
      <h1>{getMessage('optionsTitle')}</h1>
      <div className="theme-selector">
        <label>{getMessage('darkMode')}</label>
        <ThemeToggle />
      </div>
    </header>
  );
}

export { Header };
