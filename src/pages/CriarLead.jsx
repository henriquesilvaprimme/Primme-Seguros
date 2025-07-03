import React, { useState } from "react";

export default function CriarLead() {
  const [lead, setLead] = useState({
    id: "",
    name: "",
    vehiclemodel: "",
    vehicleyearmodel: "",
    city: "",
    phone: "",
    insurancetype: "",
    data: "",
    origem: "Leads",
    status: "",
    responsavel: "",
    editado: "",
  });

  const [message, setMessage] = useState("");

  function gerarId() {
    return Date.now().toString();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setLead((prev) => ({ ...prev, [name]: value }));
  }

  async function salvarLead() {
    if (!lead.id) {
      lead.id = gerarId();
      setLead((prev) => ({ ...prev, id: lead.id }));
    }

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec",
      {
        method: "POST",
        body: JSON.stringify({
          action: "salvarLead",
          lead: lead,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao salvar lead: " + response.statusText);
    }

    const text = await response.text();
    return text;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const result = await salvarLead();

      if (result.includes("adicionado") || result.includes("ok")) {
        setMessage("Lead salvo com sucesso!");
        setLead({
          id: "",
          name: "",
          vehiclemodel: "",
          vehicleyearmodel: "",
          city: "",
          phone: "",
          insurancetype: "",
          data: "",
          origem: "Leads",
          status: "",
          responsavel: "",
          editado: "",
        });
      } else {
        setMessage("Resposta inesperada: " + result);
      }
    } catch (error) {
      setMessage("Erro: " + error.message);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Criar Lead</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          name="name"
          placeholder="Nome"
          value={lead.name}
          onChange={handleChange}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          name="vehiclemodel"
          placeholder="Modelo do veículo"
          value={lead.vehiclemodel}
          onChange={handleChange}
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          name="vehicleyearmodel"
          placeholder="Ano do veículo"
          value={lead.vehicleyearmodel}
          onChange={handleChange}
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          name="city"
          placeholder="Cidade"
          value={lead.city}
          onChange={handleChange}
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          name="phone"
          placeholder="Telefone"
          value={lead.phone}
          onChange={handleChange}
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          name="insurancetype"
          placeholder="Tipo de seguro"
          value={lead.insurancetype}
          onChange={handleChange}
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          name="data"
          placeholder="Data"
          type="date"
          value={lead.data}
          onChange={handleChange}
          style={{ padding: 8, fontSize: 16 }}
        />

        <button
          type="submit"
          style={{
            padding: 10,
            backgroundColor: "#007bff",
            color: "white",
            fontSize: 16,
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Salvar Lead
        </button>
      </form>
      {message && (
        <p
          style={{
            marginTop: 16,
            textAlign: "center",
            color: message.toLowerCase().includes("erro") ? "red" : "green",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
