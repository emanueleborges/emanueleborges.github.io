// Idiomas do site — fonte única. Seletor de idioma de cada página, carregador de traduções, demos,
// currículo, SEO (hreflang/og:locale), geradores e a IA do Worker leem daqui. Cada idioma precisa do
// arquivo i18n/<código>.js (e dos textos das demos). A ordem é a do seletor; o primeiro é o padrão.
// Script clássico (globalThis.IDIOMAS): roda no navegador, no Worker e nos scripts Node.
globalThis.IDIOMAS = {
  //  html: atributo lang · og: og:locale · nome: no seletor · ia: como a IA chama o idioma
  en: { html: "en", og: "en_US", nome: "English", ia: "English" },
  pt: { html: "pt-BR", og: "pt_BR", nome: "Português", ia: "Brazilian Portuguese" },
  es: { html: "es", og: "es_ES", nome: "Español", ia: "Spanish" },
};
