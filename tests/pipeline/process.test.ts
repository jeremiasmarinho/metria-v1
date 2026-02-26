import { describe, it, expect } from "vitest";
import { calcVariation } from "@/lib/pipeline/process";

describe("calcVariation", () => {
  it("calcula aumento de 100 para 150 como +50%", () => {
    expect(calcVariation(150, 100)).toBe(50);
  });

  it("calcula queda de 200 para 100 como -50%", () => {
    expect(calcVariation(100, 200)).toBe(-50);
  });

  it("anterior zero e actual positivo retorna 100%", () => {
    expect(calcVariation(50, 0)).toBe(100);
  });

  it("ambos zero retorna 0%", () => {
    expect(calcVariation(0, 0)).toBe(0);
  });

  it("valores iguais retorna 0%", () => {
    expect(calcVariation(100, 100)).toBe(0);
  });

  it("calcula variação com decimais correctamente", () => {
    const result = calcVariation(100, 33);
    expect(result).toBeCloseTo(203.03, 1);
  });
});
