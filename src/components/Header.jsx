import React from 'react';
import { getMessage } from '../utils/i18n.js';
import { ThemeToggle } from './ThemeToggle.jsx';

function Header({ settings }) {
    return (
        <header>
            <h1 data-i18n="optionsTitle">{getMessage('optionsTitle')}</h1>
            <div className="theme-selector">
                <label data-i18n="darkMode">{getMessage('darkMode')}</label>
                <ThemeToggle />
            </div>
        </header>
    );
}

export { Header };
