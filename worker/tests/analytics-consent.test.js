import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../analytics-consent.js"), "utf8")
  .replace('import { PortfolioApi } from "./api.js";\n', "");

function loadConsent({ stored = null, lang = "pt-BR" } = {}) {
  const values = new Map(stored ? [["portfolio-region-consent-v3", stored]] : []);
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
  const documentListeners = {};
  const document = {
    body: { append(element) { elements.root = element; } },
    documentElement: { lang },
    createElement() { return root; },
    addEventListener(type, fn) {
      (documentListeners[type] ??= []).push(fn);
    },
  };
  const window = {};
  const PortfolioApi = {
    recordVisit() {
      calls.push("visit");
      return Promise.resolve();
    },
    recordClick(target) {
      calls.push(`click:${target}`);
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
  // Simula um clique em um elemento com os data-* dados (event.target.closest devolve o próprio elemento).
  const click = (dataset) => {
    const element = dataset ? { dataset } : null;
    (documentListeners.click ?? []).forEach((fn) => fn({ target: { closest: () => element } }));
  };
  return { accepted, calls, click, description, elements, values, window };
}

test("does not record a visit until the visitor accepts", () => {
  const consent = loadConsent();

  assert.equal(consent.elements.root.shadowRoot.querySelector(".panel").hidden, false);
  assert.match(consent.description.textContent, /IP/);
  assert.equal(consent.calls.length, 0);

  consent.accepted.listeners.click();

  assert.equal(consent.values.get("portfolio-region-consent-v3"), "accepted");
  assert.deepEqual(consent.calls, ["visit"]);
  assert.deepEqual(Object.keys(consent.window), []);
  assert.match(consent.description.textContent, /30 dias/);
});

test("stores rejection without exposing a control to reopen consent", () => {
  const consent = loadConsent();
  const panel = consent.elements.root.shadowRoot.querySelector(".panel");

  consent.elements.root.shadowRoot.querySelector('[data-choice="rejected"]').listeners.click();
  assert.equal(consent.values.get("portfolio-region-consent-v3"), "rejected");
  assert.equal(consent.calls.length, 0);
  assert.equal(panel.hidden, true);
  assert.equal(consent.elements.root.shadowRoot.querySelector(".settings"), undefined);
});

test("records an aggregate count for a previously accepted choice", () => {
  const consent = loadConsent({ stored: "accepted" });

  assert.deepEqual(consent.calls, ["visit"]);
  assert.equal(consent.elements.root.shadowRoot.querySelector(".settings"), undefined);
});

test("counts link clicks only after the visitor accepts", () => {
  const consent = loadConsent();

  consent.click({ track: "contact-linkedin" });
  assert.deepEqual(consent.calls, []);
  assert.match(consent.description.textContent, /cliques/);

  consent.accepted.listeners.click();
  consent.click({ track: "contact-linkedin" });
  consent.click({ repo: "tcc-ufg" });
  consent.click({ demo: "lstm" });
  consent.click(null);

  assert.deepEqual(consent.calls, ["visit", "click:contact-linkedin", "click:code:tcc-ufg", "click:demo:lstm"]);
});

test("does not count clicks after rejection", () => {
  const consent = loadConsent({ stored: "rejected" });

  consent.click({ track: "contact-github" });
  assert.deepEqual(consent.calls, []);
});
