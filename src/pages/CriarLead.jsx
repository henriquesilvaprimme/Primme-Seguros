import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

export default function CriarLead() {
  const init = {
    nome: '',
    modeloVeiculo: '',
    anoModelo: '',
    cidade: '',
    telefone: '',
    tipoSeguro: '',
  };
  const [form, setForm] = useState(init);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const gerarId = () =>
    (crypto.randomUUID && crypto.randomUUID()) ||
    Math.random().toString(36).substring(2, 12);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nome || !form.telefone) {
      alert('Nome e Telefone são obrigatórios.');
      return;
    }

    const payload = {
      action: 'salvarLead',
      lead: {
        id: gerarId(),
        nome: form.nome,
        modeloveiculo: form.modeloVeiculo,
        anomodelo: form.anoModelo,
        cidade: form.cidade,
        telefone: form.telefone,
        tipodeseguro: form.tipoSeguro,
        status: 'Sem Contato',
        createdAt: new Date().toISOString(),
        origem: undefined, // ficará na aba "Leads"
      },
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Lead criado com sucesso!');
      setForm(init);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar lead.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Criar Lead</h2>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 max-w-lg"
        autoComplete="off"
      >
        {[
          { id: 'nome', label: 'Nome', value: form.nome },
          {
            id: 'modeloVeiculo',
            label: 'Modelo do veículo',
            value: form.modeloVeiculo,
          },
          {
            id: 'anoModelo',
            label: 'Ano/Modelo',
            value: form.anoModelo,
          },
          { id: 'cidade', label: 'Cidade', value: form.cidade },
          { id: 'telefone', label: 'Telefone', value: form.telefone },
          {
            id: 'tipoSeguro',
            label: 'Tipo de Seguro',
            value: form.tipoSeguro,
          },
        ].map(({ id, label, value }) => (
          <div key={id} className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor={id} className="text-right">
              {label}
            </Label>
            <Input
              id={id}
              name={id}
              value={value}
              onChange={onChange}
              className="col-span-3"
            />
          </div>
        ))}

        <Button type="submit" className="w-40 mt-2">
          Salvar
        </Button>
      </form>
    </div>
  );
}
