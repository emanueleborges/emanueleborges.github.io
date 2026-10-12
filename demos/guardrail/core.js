const INJECTION_PATTERNS = [
  /ignore (?:all )?(?:previous|prior|above|system|safety)? ?instructions?/i,
  /reveal (?:the )?(?:secret|hidden|system prompt)/i,
  /send (?:the )?secret/i,
  /override (?:the )?(?:system|safety|rules)/i,
  /disregard (?:all )?(?:previous|prior|system|safety)? ?instructions?/i,
  /ignore (?:todas? )?(?:as )?instrucoes anteriores/i,
  /revele? (?:o )?segredo/i,
  /substitua (?:as )?regras/i,
  /ignora (?:todas? )?(?:las? )?instrucciones anteriores|ignora tutte le istruzioni precedenti|ignore toutes les instructions precedentes|ignoriere alle vorherigen anweisungen|忽略之前的所有指令|игнорируй все предыдущие инструкции/i,
];

export function containsInjectionAttempt(...untrustedInputs) {
  const normalized = untrustedInputs.map((input) =>
    String(input).normalize("NFD").replace(/(?<=\p{Script=Latin})\p{M}/gu, "").normalize("NFC"),
  );
  return INJECTION_PATTERNS.some((pattern) => normalized.some((input) => pattern.test(input)));
}

export function simulateRag({ question, retrievedDocument, trustedAnswer }) {
  const injectionDetected = containsInjectionAttempt(question, retrievedDocument);

  return {
    injectionDetected,
    vulnerableResponse: injectionDetected
      ? "SIMULATED FAILURE: the untrusted instruction was followed and exposed the fake demo value [DEMO-ONLY-SECRET-42]."
      : `Simulated answer from the retrieved portfolio fact: ${trustedAnswer}`,
    defendedResponse: injectionDetected
      ? `The request or retrieved text contains an instruction that conflicts with the assistant's rules, so it is ignored. Trusted portfolio fact: ${trustedAnswer}`
      : `Trusted portfolio fact: ${trustedAnswer}`,
  };
}
