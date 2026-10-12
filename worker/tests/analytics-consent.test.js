import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../analytics-consent.js"), "utf8")
  .replace('import { PortfolioApi } from "./api.js";\n', "");

function loadConsent({ stored = null, lang = "pt-BR", hasFooterSettings = true } = {}) {
  const values = new Map(stored ? [["portfolio-region-consent-v2", stored]] : []);
  const calls = [];
  const elements = {};
  const makeButton = (choice) => ({
    dataset: { choice },
    listeners: {},
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
    focus() {},
  });
  const accepted = makeButton("accepted");
  const rejected = makeButton("rejected");
  const panel = { hidden: false };
  const makeSettings = () => ({
    hidden: false,
    attributes: {},
    listeners: {},
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    focus() {},
    remove() { this.removed = true; },
  });
  const floatingSettings = makeSettings();
  const footerSettings = hasFooterSettings ? makeSettings() : null;
  const title = {};
  const description = {};
  const shadow = {
    querySelector(selector) {
      return {
        "#consent-title": title,
        "#consent-description": description,
        ".panel": panel,
        '[data-choice="accepted"]': accepted,
        '[data-choice="rejected"]': rejected,
        ".settings": floatingSettings,
      }[selector];
    },
    querySelectorAll(selector) {
      return selector === "[data-choice]" ? [accepted, rejected] : [];
    },
  };
  const root = {
    shadowRoot: shadow,
    attachShadow() {
      return shadow;
    },
    setAttribute() {},
  };
  const document = {
    body: { append(element) { elements.root = element; } },
    documentElement: { lang },
    createElement() { return root; },
    querySelector(selector) {
      return selector === "[data-privacy-settings]" ? footerSettings : null;
    },
    addEventListener() {},
  };
  const window = {};
  const PortfolioApi = {
    recordVisit() {
      calls.push("visit");
      return Promise.resolve();
    },
  };
  const context = {
    document,
    window,
    PortfolioApi,
    location: { search: "" },
    URLSearchParams,
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, value); },
    },
  };

  runInNewContext(source, context);
  return { accepted, calls, description, elements, floatingSettings, footerSettings, values, window };
}

test("does not record a visit until the visitor accepts", () => {
  const consent = loadConsent();

  assert.equal(consent.elements.root.shadowRoot.querySelector(".panel").hidden, false);
  assert.match(consent.description.textContent, /IP/);
  assert.equal(consent.calls.length, 0);

  consent.accepted.listeners.click();

  assert.equal(consent.values.get("portfolio-region-consent-v2"), "accepted");
  assert.deepEqual(consent.calls, ["visit"]);
  assert.deepEqual(Object.keys(consent.window), []);
  assert.match(consent.description.textContent, /30 dias/);
});

test("footer privacy control reopens a rejected choice without a floating button", () => {
  const consent = loadConsent();
  const panel = consent.elements.root.shadowRoot.querySelector(".panel");

  consent.elements.root.shadowRoot.querySelector('[data-choice="rejected"]').listeners.click();
  assert.equal(consent.values.get("portfolio-region-consent-v2"), "rejected");
  assert.equal(consent.calls.length, 0);
  assert.equal(panel.hidden, true);
  assert.equal(consent.floatingSettings.removed, true);

  consent.footerSettings.listeners.click();
  assert.equal(panel.hidden, false);
});

test("records an aggregate count for a previously accepted choice", () => {
  const consent = loadConsent({ stored: "accepted" });

  assert.deepEqual(consent.calls, ["visit"]);
  assert.equal(consent.footerSettings.hidden, false);
  assert.equal(consent.floatingSettings.removed, true);
});

test("keeps the floating privacy control on pages without a footer link", () => {
  const consent = loadConsent({ stored: "rejected", hasFooterSettings: false });

  assert.equal(consent.floatingSettings.hidden, false);
  consent.floatingSettings.listeners.click();
  assert.equal(consent.elements.root.shadowRoot.querySelector(".panel").hidden, false);
});
