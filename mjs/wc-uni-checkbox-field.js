import { _wcl } from './common-lib.js';
import { _wccss } from './common-css.js';
import {
  colorPalette as _uniColorPalette
} from 'https://unpkg.com/uni-input-field/mjs/uni-css.js';

const defaults = {
  round: false,
};

const booleanAttrs = ['round'];
const objectAttrs = [];
const custumEvents = {};

const template = document.createElement('template');
template.innerHTML = `
<style>
${_wccss}
${_uniColorPalette}

:host{position:relative;inline-size:fit-content;display:block;}

:host([hidden]) {
  display: none;
}

:host([round]) {
  .main {
    --border-radius: var(--size);
  }
}

.main {
  --border-color-normal: var(--uni-checkbox-field-border-color-normal, var(--ct_checkbox_main_focus-outline_default));
  --border-color-hover: var(--uni-checkbox-field-border-color-hover, var(--ct_checkbox_main_focus-outline_hover));
  --border-color-checked: var(--uni-checkbox-field-border-color-checked, var(--ct_checkbox_main_container_selected));
  --border-color-disabled: var(--uni-checkbox-field-border-color-checked, var(--ct_checkbox_main_focus-outline_disabled));
  --border-color: var(--border-color-normal);

  --background-color-normal: var(--uni-checkbox-field-background-color-normal, var(--ct_checkbox_main_container_default));
  --background-color-hover: var(--uni-checkbox-field-background-color-hover, var(--ct_checkbox_main_container_hover));
  --background-color-checked: var(--uni-checkbox-field-background-color-checked, var(--ct_checkbox_main_container_selected));
  --background-color-disabled: var(--uni-checkbox-field-background-color-disabled, var(--ct_checkbox_main_container_disabled));
  --background-color: var(--background-color-normal);

  --checkmark-color-normal: var(--uni-checkbox-field-checkmark-color-normal, var(--ct_checkbox_main_unit_selected));
  --checkmark-color-disabled: var(--uni-checkbox-field-checkmark-color-disabled, var(--ct_checkbox_moderate_unit_disabled));
  --checkmark-color: var(--checkmark-color-normal);

  --checkmark-scale-normal: .001;
  --checkmark-scale-active: 1;
  --checkmark-scale: var(--checkmark-scale-normal);

  --size: 16px;
  --border-radius: 4px;

  inline-size: fit-content;

  .main__label {
    position: relative;
    inline-size: var(--size);
    aspect-ratio: 1/1;
  }
  
  /* checkbox */
  ::slotted(input[type=checkbox]) {
    inline-size: var(--size);
    aspect-ratio: 1/1;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    transition: border-color .15s ease, background-color .15s ease;
    will-change: border-color, background-color;
    display: grid;
    place-content: center;
  }

  ::slotted(input[type=checkbox]:checked) {
    --border-color: var(--border-color-checked);
    --background-color: var(--background-color-checked);
    --checkmark-scale: var(--checkmark-scale-active);
  }

  ::slotted(input[type=checkbox]:disabled) {
    --border-color: var(--border-color-disabled);
    --background-color: var(--background-color-disabled);
    --checkmark-color: var(--checkmark-color-disabled);
  }
}
</style>

<div class="main" ontouchstart="">
  <div class="main__label">
    <slot name="checkbox"></slot>
  </div>
</div>
`;

/* style injection */
const styleInjection = `
uni-checkbox-field input[type=checkbox] {
  outline: 0 none;
  resize: none;
  appearance: none;
  box-shadow: none;

  &:not(&:disabled,&:checked):focus-visible {
    --border-color: var(--border-color-hover);
  }

  @media (hover: hover) {
    &:not(&:disabled,&:checked):hover {
      --border-color: var(--border-color-hover);
    }
  }

  &::after {
    content: '';
    inline-size: 11px;
    block-size: 8px;
    background-color: var(--checkmark-color);
    clip-path: path('M4.41747 7.60407L4.39985 7.62169L0 3.22185L1.43268 1.78917L4.41752 4.77402L9.19154 0L10.6242 1.43268L4.43514 7.62175L4.41747 7.60407Z');
    display: block;
    transition: scale .15s ease;
    scale: var(--checkmark-scale);
  }
}

[inert] uni-checkbox-field input[type=checkbox] {
  --border-color: var(--border-color-disabled);
  --background-color: var(--background-color-disabled);
  --checkmark-color: var(--checkmark-color-disabled);
}
`;

const INJECT_KEY = Symbol.for('uni.checkbox.field.ui.injected');
const uiInit = () => {
  if (window[INJECT_KEY]) {
    return;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styleInjection);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

  window[INJECT_KEY] = true;
};
uiInit();

export class UniCheckboxField extends HTMLElement {
  #data;
  #nodes;
  #config;

  constructor(config) {
    super();

    // template
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // data
    this.#data = {
      controller: '',
    };

    // nodes
    this.#nodes = {};

    // config
    this.#config = {
      ...defaults,
      ...config // new UniCheckboxField(config)
    };
  }

  async connectedCallback() {
    const { config, error } = await _wcl.getWCConfig(this);

    if (error) {
      console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${error}`);
      this.remove();
      return;
    } else {
      this.#config = {
        ...this.#config,
        ...config
      };
    }

    // upgradeProperty
    Object.keys(defaults).forEach((key) => this.#upgradeProperty(key));
  }

  disconnectedCallback() {
    this.#data.controller.abort?.();
  }

  /*
  #format(attrName, oldValue, newValue) {
    const hasValue = newValue !== null;

    if (!hasValue) {
      if (booleanAttrs.includes(attrName)) {
        this.#config[attrName] = false;
      } else {
        this.#config[attrName] = defaults[attrName];
      }
    } else {
      switch (attrName) {
        case 'round':
          this.#config[attrName] = true;
          break;
      }
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (!UniCheckboxField.observedAttributes.includes(attrName)) {
      return;
    }

    this.#format(attrName, oldValue, newValue);
  }
  */

  static get observedAttributes() {
    return Object.keys(defaults); // UniCheckboxField.observedAttributes
  }

  static get supportedEvents() {
    return Object.keys(custumEvents).map(
      (key) => {
        return custumEvents[key];
      }
    );
  }

  #upgradeProperty(prop) {
    let value;

    if (UniCheckboxField.observedAttributes.includes(prop)) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        value = this[prop];
        delete this[prop];
      } else {
        if (booleanAttrs.includes(prop)) {
          value = (this.hasAttribute(prop) || this.#config[prop]) ? true : false;
        } else if (objectAttrs.includes(prop)) {
          value = this.hasAttribute(prop) ? this.getAttribute(prop) : JSON.stringify(this.#config[prop]);
        } else {
          value = this.hasAttribute(prop) ? this.getAttribute(prop) : this.#config[prop];
        }
      }

      this[prop] = value;
    }
  }

  set round(value) {
    this.toggleAttribute('round', Boolean(value));
  }

  get round() {
    return this.#config.round;
  }

  refresh() {
    this.hidden = true;
    this.offsetHeight;
    this.hidden = false;
  }
}

// define web component
const S = _wcl.supports();
const T = _wcl.classToTagName('UniCheckboxField');
if (S.customElements && S.shadowDOM && S.template && !window.customElements.get(T)) {
  window.customElements.define(_wcl.classToTagName('UniCheckboxField'), UniCheckboxField);
}