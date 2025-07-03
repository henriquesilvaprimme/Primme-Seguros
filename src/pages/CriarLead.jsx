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

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec",
        {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({
            action: "salvarLead",
            lead: lead,
          }),
        }
      );
      // Com no-cors, não dá para ler a resposta, então damos mensagem padrão:
      setMessage("Lead enviado! (Não é possível confirmar sucesso por causa do no-cors)");
    } catch (error) {
      setMessage("Erro ao enviar lead: " + error.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    salvarLead();

    // Resetar formulário independentemente da resposta, pois não temos retorno:
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
  }

  return (
    <div className="container-criar-lead">
      <h2>Criar Lead</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nome:
          <input
            type="text"
            name="name"
            value={lead.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Modelo do Veículo:
          <input
            type="text"
            name="vehiclemodel"
            value={lead.vehiclemodel}
            onChange={handleChange}
          />
        </label>

        <label>
          Ano do Veículo:
          <input
            type="text"
            name="vehicleyearmodel"
            value={lead.vehicleyearmodel}
            onChange={handleChange}
          />
        </label>

        <label>
          Cidade:
          <input
            type="text"
            name="city"
            value={lead.city}
            onChange={handleChange}
          />
        </label>

        <label>
          Telefone:
          <input
            type="text"
            name="phone"
            value={lead.phone}
            onChange={handleChange}
          />
        </label>

        <label>
          Tipo de Seguro:
          <input
            type="text"
            name="insurancetype"
            value={lead.insurancetype}
            onChange={handleChange}
          />
        </label>

        <label>
          Data:
          <input
            type="date"
            name="data"
            value={lead.data}
            onChange={handleChange}
          />
        </label>

        <button type="submit">Salvar Lead</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
