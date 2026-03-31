"use client";

import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const API_BASE =  `${process.env.NEXT_PUBLIC_MAIN}`;

export type EmergencyContact = {
  id?: number;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  relationship?: string;
};

export default function EmergencyContactsSection({
  employeeId,
}: {
  employeeId?: string;
}) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const [viewContact, setViewContact] = useState<EmergencyContact | null>(null);
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null);

  const [form, setForm] = useState<EmergencyContact>({
    name: "",
    email: "",
    mobile: "",
    address: "",
    relationship: "",
  });

  const token = () => localStorage.getItem("accessToken") || "";

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!employeeId) return;
    fetch(`${API_BASE}/employee/${employeeId}/emergency-contacts`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then(setContacts)
      .catch(() => {});
  }, [employeeId]);

  /* ================= CREATE ================= */
  const createContact = async () => {
    const res = await fetch(
      `${API_BASE}/employee/${employeeId}/emergency-contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    const json = await res.json();
    setContacts((p) => [...p, json]);
    setShowCreate(false);
    setForm({ name: "", email: "", mobile: "", address: "", relationship: "" });
  };

  /* ================= UPDATE ================= */
  const updateContact = async () => {
    if (!editContact?.id) return;

    const res = await fetch(
      `${API_BASE}/employee/${employeeId}/emergency-contacts/${editContact.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editContact.name,
          mobile: editContact.mobile,
          address: editContact.address,
          relationship: editContact.relationship,
        }),
      }
    );

    const json = await res.json();
    setContacts((p) => p.map((c) => (c.id === json.id ? json : c)));
    setEditContact(null);
  };

  /* ================= DELETE ================= */
  const deleteContact = async (id?: number) => {
    if (!id) return;
    if (!confirm("Delete this emergency contact?")) return;

    await fetch(
      `${API_BASE}/employee/${employeeId}/emergency-contacts/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      }
    );
    setContacts((p) => p.filter((c) => c.id !== id));
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm mt-8">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Emergency Details</h2>
        <Button variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create New
        </Button>
      </div>

      {/* ================= CREATE ================= */}
      {showCreate && (
        <div className="border rounded-md p-4 bg-slate-50 mb-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Mobile" onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <Input placeholder="Relationship" onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
            <Textarea className="md:col-span-2" placeholder="Address"
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={createContact}>Add</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <table className="w-full text-sm border">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Mobile</th>
            <th className="p-3">Relationship</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.email}</td>
              <td className="p-3">{c.mobile}</td>
              <td className="p-3">{c.relationship}</td>
              <td className="p-3 text-right relative">
                <button onClick={() => setActiveMenu(c.id!)}>
                  <MoreHorizontal />
                </button>

                {activeMenu === c.id && (
                  <div className="absolute right-0 mt-2 bg-white border rounded shadow w-32 z-10">
                    <button className="w-full px-3 py-2 hover:bg-slate-100"
                      onClick={() => { setViewContact(c); setActiveMenu(null); }}>
                      View
                    </button>
                    <button className="w-full px-3 py-2 hover:bg-slate-100"
                      onClick={() => { setEditContact(c); setActiveMenu(null); }}>
                      Edit
                    </button>
                    <button className="w-full px-3 py-2 text-red-600 hover:bg-slate-100"
                      onClick={() => deleteContact(c.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= VIEW ================= */}
      {viewContact && (
        <Modal title="View Emergency Contact" onClose={() => setViewContact(null)}>
          {Object.entries(viewContact).map(([k, v]) => (
            k !== "id" && (
              <div key={k} className="flex mb-2">
                <div className="w-32 capitalize text-slate-500">{k}</div>
                <div>{v || "--"}</div>
              </div>
            )
          ))}
        </Modal>
      )}

      {/* ================= EDIT ================= */}
      {editContact && (
        <Modal title="Edit Emergency Contact" onClose={() => setEditContact(null)}>
          <div className="grid md:grid-cols-2 gap-3">
            <Input value={editContact.name}
              onChange={(e) => setEditContact({ ...editContact, name: e.target.value })} />
            <Input value={editContact.email} disabled />
            <Input value={editContact.mobile}
              onChange={(e) => setEditContact({ ...editContact, mobile: e.target.value })} />
            <Input value={editContact.relationship}
              onChange={(e) => setEditContact({ ...editContact, relationship: e.target.value })} />
            <Textarea className="md:col-span-2"
              value={editContact.address}
              onChange={(e) => setEditContact({ ...editContact, address: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditContact(null)}>Cancel</Button>
            <Button onClick={updateContact}>Save</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= SIMPLE MODAL ================= */
function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[520px] p-6">
        <h3 className="font-semibold mb-4">{title}</h3>
        {children}
        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
