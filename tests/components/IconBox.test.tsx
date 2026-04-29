import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { Settings, Bell } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconBox, type IconBoxSize } from '../../src/components/UI/IconBox/IconBox';

const wrap = (ui: ReactNode) => render(<Theme>{ui}</Theme>);

describe('IconBox', () => {
  it('renders a span with aria-hidden and an svg child by default', () => {
    const { container } = wrap(<IconBox icon={Settings} />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.getAttribute('aria-hidden')).toBe('true');
    expect(span?.querySelector('svg')).not.toBeNull();
  });

  it.each<[IconBoxSize, number, number]>([
    ['sm', 24, 14],
    ['md', 32, 18],
    ['lg', 44, 24],
  ])('applies the correct dimensions for size=%s', (size, boxPx, iconPx) => {
    const { container } = wrap(<IconBox icon={Settings} size={size} />);
    const span = container.querySelector('span') as HTMLSpanElement;
    expect(span.style.width).toBe(`${boxPx}px`);
    expect(span.style.height).toBe(`${boxPx}px`);

    const svg = span.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('width')).toBe(String(iconPx));
    expect(svg.getAttribute('height')).toBe(String(iconPx));
  });

  it('applies the gradient variant signature styles', () => {
    const { container } = wrap(<IconBox icon={Settings} variant="gradient" />);
    const span = container.querySelector('span') as HTMLSpanElement;
    const styleAttr = span.getAttribute('style') ?? '';
    const color = span.style.color;
    expect(color === 'white' || color === 'rgb(255, 255, 255)').toBe(true);
    expect(styleAttr).toContain('var(--accent-a5)');
    expect(styleAttr).not.toContain('var(--accent-a3)');
  });

  it('applies the soft variant signature styles without box-shadow', () => {
    const { container } = wrap(<IconBox icon={Settings} variant="soft" />);
    const span = container.querySelector('span') as HTMLSpanElement;
    const styleAttr = span.getAttribute('style') ?? '';
    expect(styleAttr).toContain('var(--accent-a3)');
    expect(styleAttr).toContain('var(--accent-11)');
    expect(styleAttr).not.toContain('var(--accent-a5)');
  });

  it('uses stroke-width 2.25 for gradient and 2 for soft', () => {
    const gradient = wrap(<IconBox icon={Settings} variant="gradient" />);
    const gradientSvg = gradient.container.querySelector('svg') as SVGSVGElement;
    expect(gradientSvg.getAttribute('stroke-width')).toBe('2.25');

    const soft = wrap(<IconBox icon={Settings} variant="soft" />);
    const softSvg = soft.container.querySelector('svg') as SVGSVGElement;
    expect(softSvg.getAttribute('stroke-width')).toBe('2');
  });

  it('applies an additional className while keeping inline styles', () => {
    const { container } = wrap(
      <IconBox icon={Settings} className="custom-class" />
    );
    const span = container.querySelector('span') as HTMLSpanElement;
    expect(span.className).toContain('custom-class');
    expect(span.style.width).toBe('32px');
    expect(span.style.height).toBe('32px');
  });

  it('marks the container as decorative with aria-hidden', () => {
    const { container } = wrap(<IconBox icon={Settings} />);
    const span = container.querySelector('span') as HTMLSpanElement;
    expect(span.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the icon passed via the icon prop', () => {
    const settings = wrap(<IconBox icon={Settings} />);
    expect(settings.container.querySelector('svg')).not.toBeNull();

    const bell = wrap(<IconBox icon={Bell} />);
    expect(bell.container.querySelector('svg')).not.toBeNull();
  });
});
