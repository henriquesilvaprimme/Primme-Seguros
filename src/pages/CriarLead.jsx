// src/components/CriarLead.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** URL pública do seu Apps Script */
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec";

/** Gera um ID simples: timestamp + número aleatório */
const gerarId = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

export default function CriarLead({ onSucesso }) {
  const [form, setForm] = useState({
    name: "",
    vehicleModel: "",
    vehicleYearModel: "",
    city: "",
    phone: "",
    insuranceType: "",
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    /** Monta o payload exatamente com os _headers_ da aba Leads.
     *  Atenção: o Apps Script faz `toLowerCase()` e remove espaços,
     *  então usamos as mesmas versões “normalizadas” das colunas. */
    const lead = {
      id: gerarId(),
      name: form.name,
      vehiclemodel: form.vehicleModel,
      vehicleyearmodel: form.vehicleYearModel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insuranceType,
      data: new Date().toLocaleDateString("pt-BR"),
      responsável: "",   // preencha com usuário logado, se quiser
      status: "",        // deixe vazio ou escolha um padrão
      editado: "",
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "salvarLead", lead }),
        // Caso você ainda enfrente pre‑flight CORS, teste:
        // mode: "no-cors"
      });

      if (!res.ok && res.type !== "opaque")
        throw new Error("Erro ao salvar lead");

      setMensagem("Lead criado com sucesso!");
      setForm({
        name: "",
        vehicleModel: "",
        vehicleYearModel: "",
        city: "",
        phone: "",
        insuranceType: "",
      });
      onSucesso?.(); // recarrega lista, se o pai fornecer
    } catch (err) {
      setMensagem(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardContent className="p-6 space-y-5">
        <h2 className="text-2xl font-bold text-indigo-700">Criar Lead</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            required
            name="name"
            placeholder="Nome"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            required
            name="vehicleModel"
            placeholder="Modelo do veículo"
            value={form.vehicleModel}
            onChange={handleChange}
          />
          <Input
            required
            name="vehicleYearModel"
            placeholder="Ano/Modelo"
            value={form.vehicleYearModel}
            onChange={handleChange}
          />
          <Input
            required
            name="city"
            placeholder="Cidade"
            value={form.city}
            onChange={handleChange}
          />
          <Input
            required
            name="phone"
            placeholder="Telefone"
            value={form.phone}
            onChange={handleChange}
          />
          <Input
            required
            name="insuranceType"
            placeholder="Tipo de seguro (Auto, Moto…)"
            value={form.insuranceType}
            onChange={handleChange}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando…" : "Criar Lead"}
          </Button>
        </form>

        {mensagem && (
          <p className="text-center text-sm text-indigo-600">{mensagem}</p>
        )}
      </CardContent>
    </Card>
  );
}
