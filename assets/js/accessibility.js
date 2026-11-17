(() => {
  const app = window.RentoCar = window.RentoCar || {};
  const THEMES = ["light", "dark"];
  const TEXT_SIZES = ["normal", "large", "xlarge"];
  const LABELS = { light: "Light", dark: "Dark", normal: "Normal", large: "Large", xlarge: "Extra large" };

  const isPreferences = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
    && THEMES.includes(value.theme) && TEXT_SIZES.includes(value.textSize);

  class AccessibilityPreferences {
    constructor(storage, key = "accessibilityPreferences") {
      this.storage = storage;
      this.key = key;
      this.values = this.load();
    }

    static defaults() {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      return { theme: prefersDark ? "dark" : "light", textSize: "normal" };
    }

    load() {
      const saved = this.storage ? this.storage.read(this.key, null, isPreferences) : null;
      return saved ?? AccessibilityPreferences.defaults();
    }

    update(changes) {
      this.values = { ...this.values, ...changes };
      this.apply();
      return this.storage ? this.storage.write(this.key, this.values, isPreferences) : false;
    }

    reset() {
      this.values = AccessibilityPreferences.defaults();
      this.apply();
      return this.storage ? this.storage.remove(this.key) : false;
    }

    apply() {
      const root = document.documentElement;
      root.dataset.theme = this.values.theme;
      root.dataset.bsTheme = this.values.theme;
      root.dataset.textSize = this.values.textSize;
    }
  }

  const preferences = new AccessibilityPreferences(app.storage);
  preferences.apply();
  app.accessibility = preferences;

  function radioGroup(name, legend, options, current) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "a11y-group";
    const title = document.createElement("legend");
    title.textContent = legend;
    fieldset.append(title);

    for (const option of options) {
      const label = document.createElement("label");
      label.className = "a11y-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = option;
      input.checked = option === current;
      label.append(input, document.createTextNode(LABELS[option]));
      fieldset.append(label);
    }
    return fieldset;
  }

  function buildPanel() {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "a11y-toggle";
    toggle.id = "a11yToggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "a11yPanel");
    toggle.textContent = "Accessibility";

    const panel = document.createElement("section");
    panel.className = "a11y-panel";
    panel.id = "a11yPanel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "a11yTitle");

    const heading = document.createElement("h2");
    heading.id = "a11yTitle";
    heading.textContent = "Display settings";

    const status = document.createElement("p");
    status.className = "a11y-status";
    status.setAttribute("role", "status");

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "a11y-reset";
    reset.textContent = "Reset settings";

    const hint = document.createElement("p");
    hint.className = "a11y-hint";
    hint.textContent = "Press Esc to close this panel.";

    const form = document.createElement("form");
    form.addEventListener("submit", (event) => event.preventDefault());
    const render = () => {
      form.replaceChildren(
        radioGroup("theme", "Theme", THEMES, preferences.values.theme),
        radioGroup("textSize", "Text size", TEXT_SIZES, preferences.values.textSize),
      );
    };
    render();

    const report = (saved, message) => {
      status.textContent = saved ? message : `${message} Settings could not be saved in this browser.`;
    };

    form.addEventListener("change", (event) => {
      const { name, value } = event.target;
      if (name === "theme" && THEMES.includes(value)) {
        report(preferences.update({ theme: value }), `${LABELS[value]} theme on.`);
      } else if (name === "textSize" && TEXT_SIZES.includes(value)) {
        report(preferences.update({ textSize: value }), `Text size: ${LABELS[value].toLowerCase()}.`);
      }
    });

    reset.addEventListener("click", () => {
      const ok = preferences.reset();
      render();
      report(ok, "Settings reset to default.");
      reset.focus();
    });

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) form.querySelector("input:checked")?.focus();
    }

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key === preferences.key || event.key === null) {
        preferences.values = preferences.load();
        preferences.apply();
        render();
      }
    });

    panel.append(heading, form, reset, status, hint);
    document.body.append(toggle, panel);
  }

  function addSkipLink() {
    const main = document.querySelector("main");
    if (!main) return;
    main.id = main.id || "main-content";
    main.tabIndex = -1;
    const link = document.createElement("a");
    link.className = "skip-link";
    link.href = `#${main.id}`;
    link.textContent = "Skip to main content";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      main.focus();
      main.scrollIntoView();
    });
    document.body.prepend(link);
  }

  function init() {
    addSkipLink();
    buildPanel();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
