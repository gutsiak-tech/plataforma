import { describe, expect, it } from "vitest";
import { filterStateFromSearchParams } from "./filterFromUrl";

describe("filterStateFromSearchParams", () => {
  it("usa PR e competência vazia quando a query está vazia", () => {
    expect(filterStateFromSearchParams(new URLSearchParams(""))).toEqual({
      uf: "PR",
      competencia: "",
    });
  });

  it("lê uf e competência da query", () => {
    const p = new URLSearchParams("uf=SP&competencia=2024-06");
    expect(filterStateFromSearchParams(p)).toEqual({ uf: "SP", competencia: "2024-06" });
  });

  it("ignora competência ausente", () => {
    const p = new URLSearchParams("uf=MG");
    expect(filterStateFromSearchParams(p)).toEqual({ uf: "MG", competencia: "" });
  });
});
