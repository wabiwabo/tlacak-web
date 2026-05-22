import type maplibregl from 'maplibre-gl';
import type { MapStyle } from './map-styles';

type SwitchHook = () => void;
type SelectHook = (styleId: string) => void;

/** A MapLibre control that lets the user pick a base map style. */
export class SwitcherControl implements maplibregl.IControl {
  private container: HTMLElement | null = null;
  private styles: MapStyle[] = [];
  private currentStyle: string | null = null;

  constructor(
    private readonly onBeforeSwitch: SwitchHook,
    private readonly onSelect: SelectHook,
    private readonly onAfterSwitch: SwitchHook,
  ) {}

  getDefaultPosition(): maplibregl.ControlPosition {
    return 'top-right';
  }

  onAdd(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group map-switcher';
    this.render();
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.container = null;
  }

  /** Updates the available styles and the default selection. */
  updateStyles(styles: MapStyle[], defaultStyle: string): void {
    this.styles = styles;
    if (!this.currentStyle) {
      this.currentStyle = styles.find((s) => s.id === defaultStyle)?.id ?? styles[0]?.id ?? null;
    }
    this.render();
  }

  /** Returns the resolved active style definition. */
  getActiveStyle(): MapStyle | undefined {
    return this.styles.find((s) => s.id === this.currentStyle);
  }

  private render(): void {
    const container = this.container;
    if (!container) {
      return;
    }
    container.replaceChildren();
    for (const style of this.styles) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = style.title ?? style.titleKey;
      button.dataset.styleId = style.id;
      if (style.id === this.currentStyle) {
        button.classList.add('active');
      }
      button.addEventListener('click', () => this.switch(style.id));
      container.appendChild(button);
    }
  }

  private switch(styleId: string): void {
    if (styleId === this.currentStyle) {
      return;
    }
    this.currentStyle = styleId;
    this.onBeforeSwitch();
    this.onSelect(styleId);
    this.onAfterSwitch();
    this.render();
  }
}
