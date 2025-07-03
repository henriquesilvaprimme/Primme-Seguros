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
      const newId = gerarId();
      setLead((prev) => ({ ...prev, id: newId }));
      lead.id = newId; // Atualiza no objeto antes do envio
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
    <div className="container-criar-lead" style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Criar Lead</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Nome:
          <input
            type="text"
            name="name"
            value={lead.name}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Modelo do Veículo:
          <input
            type="text"
            name="vehiclemodel"
            value={lead.vehiclemodel}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Ano do Veículo:
          <input
            type="text"
            name="vehicleyearmodel"
            value={lead.vehicleyearmodel}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Cidade:
          <input
            type="text"
            name="city"
            value={lead.city}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Telefone:
          <input
            type="text"
            name="phone"
            value={lead.phone}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Tipo de Seguro:
          <input
            type="text"
            name="insurancetype"
            value={lead.insurancetype}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Data:
          <input
            type="date"
            name="data"
            value={lead.data}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Salvar Lead
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}
