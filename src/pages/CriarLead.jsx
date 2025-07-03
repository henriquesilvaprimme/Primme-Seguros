import React, { useState } from "react";

export default function CriarLead() {
  const [lead, setLead] = useState({
    id: "", // Gere ou preencha esse campo
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
    editado: ""
  });

  const [message, setMessage] = useState("");

  // Função para gerar um ID simples, se desejar
  function gerarId() {
    return Date.now().toString();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setLead((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Gera ID se não tiver
    if (!lead.id) {
      lead.id = gerarId();
      setLead({ ...lead, id: lead.id });
    }

    // Monta o corpo igual Usuario.jsx, mas para salvarLead
    const body = {
      action: "salvarLead",
      lead: lead
    };

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec",
        {
          method: "POST",
          body: JSON.stringify(body)
          // NÃO coloque headers Content-Type aqui para evitar preflight CORS
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar lead: " + response.statusText);
      }

      const text = await response.text();

      if (text.includes("adicionado") || text.includes("ok")) {
        setMessage("Lead salvo com sucesso!");
      } else {
        setMessage("Resposta inesperada: " + text);
      }
    } catch (error) {
      setMessage("Erro ao salvar lead: " + error.message);
    }
  }

  return (
    <div>
      <h2>Criar Lead</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Nome"
          value={lead.name}
          onChange={handleChange}
          required
        />
        <input
          name="vehiclemodel"
          placeholder="Modelo do veículo"
          value={lead.vehiclemodel}
          onChange={handleChange}
        />
        <input
          name="vehicleyearmodel"
          placeholder="Ano do veículo"
          value={lead.vehicleyearmodel}
          onChange={handleChange}
        />
        <input
          name="city"
          placeholder="Cidade"
          value={lead.city}
          onChange={handleChange}
        />
        <input
          name="phone"
          placeholder="Telefone"
          value={lead.phone}
          onChange={handleChange}
        />
        <input
          name="insurancetype"
          placeholder="Tipo de seguro"
          value={lead.insurancetype}
          onChange={handleChange}
        />
        <input
          name="data"
          placeholder="Data"
          type="date"
          value={lead.data}
          onChange={handleChange}
        />
        {/* Outros campos se quiser */}

        <button type="submit">Salvar Lead</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
