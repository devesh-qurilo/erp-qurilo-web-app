
// src/app/settings/profile/ProfileForm.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Loader2,
  Save,
  Upload,
  Check,
  Plus,
  MoreHorizontal,
  Trash2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EmergencyContactsSection from "./EmergencyContactsSection";

const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

type ProfilePayload = {
  employeeId?: string;
  name?: string;
  email?: string;
  profilePictureUrl?: string | null;
  gender?: string;
  birthday?: string;
  bloodGroup?: string;
  language?: string;
  country?: string;
  mobile?: string;
  address?: string;
  about?: string;
  slackMemberId?: string;
  maritalStatus?: string;
};

type EmergencyContact = {
  id?: number;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  relationship?: string;
  employeeId?: string;
};

type DocumentItem = {
  id: number;
  bucket?: string;
  path?: string;
  filename?: string;
  mime?: string;
  size?: number;
  url?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  employeeId?: string;
};

export default function ProfileForm() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const docFileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [profile, setProfile] = useState<ProfilePayload>({
    employeeId: undefined,
    name: "",
    email: "",
    profilePictureUrl: null,
    gender: "",
    birthday: "",
    bloodGroup: "",
    language: "",
    country: "usa",
    mobile: "",
    address: "",
    about: "",
    slackMemberId: "",
    maritalStatus: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showNewContactForm, setShowNewContactForm] = useState<boolean>(false);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: "",
    email: "",
    mobile: "",
    address: "",
    relationship: "",
  });
  const [addingContact, setAddingContact] = useState<boolean>(false);
  const [contactsError, setContactsError] = useState<string>("");

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docUploading, setDocUploading] = useState<boolean>(false);
  const [docUploadError, setDocUploadError] = useState<string>("");
  const [docPreviewFile, setDocPreviewFile] = useState<File | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string>("");

  // Deleting state for documents (track ids being deleted)
  const [deletingDocIds, setDeletingDocIds] = useState<number[]>([]);
  const [docActionError, setDocActionError] = useState<string>("");

  // load profile + emergency contacts + documents
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const res = await fetch(`${API_BASE}/employee/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) {
          console.warn("Failed to load profile", res.status);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setProfile({
          employeeId: data.employeeId ?? undefined,
          name: data.name ?? "",
          email: data.email ?? "",
          profilePictureUrl: data.profilePictureUrl ?? null,
          gender: data.gender ?? "",
          birthday: data.birthday ?? "",
          bloodGroup: data.bloodGroup ?? "",
          language: data.language ?? "",
          country: data.country ?? "usa",
          mobile: data.mobile ?? "",
          address: data.address ?? "",
          about: data.about ?? "",
          slackMemberId: data.slackMemberId ?? "",
          maritalStatus: data.maritalStatus ?? "",
        });
        if (data.profilePictureUrl) setPreview(data.profilePictureUrl);

        const tokenHeader = { Authorization: `Bearer ${token}`, Accept: "application/json" };

        // emergency contacts
        if (data.employeeId) {
          try {
            const cRes = await fetch(`${API_BASE}/employee/${encodeURIComponent(data.employeeId)}/emergency-contacts`, {
              headers: tokenHeader,
            });
            if (cRes.ok) {
              const contacts = await cRes.json();
              if (mounted && Array.isArray(contacts)) setEmergencyContacts(contacts);
            } else {
              console.warn("Failed to load emergency contacts", cRes.status);
            }
          } catch (err) {
            console.warn("Error fetching emergency contacts", err);
          }

          // documents
          try {
            const dRes = await fetch(`${API_BASE}/employee/${encodeURIComponent(data.employeeId)}/documents`, {
              headers: tokenHeader,
            });
            if (dRes.ok) {
              const docs = await dRes.json();
              if (mounted && Array.isArray(docs)) setDocuments(docs);
            } else {
              console.warn("Failed to load documents", dRes.status);
            }
          } catch (err) {
            console.warn("Error fetching documents", err);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInput = (key: keyof ProfilePayload, value: any) => {
    setProfile((p) => ({ ...p, [key]: value }));
  };

  const onPickFile = () => fileRef.current?.click();

  const handleFile = (f?: File | null) => {
    if (!f) {
      setSelectedFile(null);
      setPreview(profile.profilePictureUrl ?? "");
      return;
    }
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    handleFile(f);
  };

  /**
   * Save profile (PUT /employee/me)
   */
  const handleSubmit = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    setError("");
    setMessage("");

    if (!profile.name || !profile.email) {
      setError("Name and Email are required.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken") || "";

      const employeeObj: any = {
        name: profile.name ?? "",
        email: profile.email ?? "",
        gender: profile.gender ?? "",
        birthday: profile.birthday ?? "",
        bloodGroup: profile.bloodGroup ?? "",
        language: profile.language ?? "",
        country: profile.country ?? "",
        mobile: profile.mobile ?? "",
        address: profile.address ?? "",
        about: profile.about ?? "",
        slackMemberId: profile.slackMemberId ?? "",
        maritalStatus: profile.maritalStatus ?? "",
      };

      const fd = new FormData();
      fd.append("employee", JSON.stringify(employeeObj));
      if (selectedFile) fd.append("file", selectedFile);

      const res = await fetch(`${API_BASE}/employee/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Save failed:", res.status, json);
        setError(json?.error || `Save failed (${res.status})`);
        setSaving(false);
        return;
      }

      setProfile((p) => ({
        ...p,
        employeeId: json.employeeId ?? p.employeeId,
        profilePictureUrl: json.profilePictureUrl ?? p.profilePictureUrl,
        name: json.name ?? p.name,
        email: json.email ?? p.email,
        gender: json.gender ?? p.gender,
        birthday: json.birthday ?? p.birthday,
        bloodGroup: json.bloodGroup ?? p.bloodGroup,
        language: json.language ?? p.language,
        country: json.country ?? p.country,
        mobile: json.mobile ?? p.mobile,
        address: json.address ?? p.address,
        about: json.about ?? p.about,
        slackMemberId: json.slackMemberId ?? p.slackMemberId,
        maritalStatus: json.maritalStatus ?? p.maritalStatus,
      }));

      if (json.profilePictureUrl) {
        setPreview(json.profilePictureUrl);
        setSelectedFile(null);
      }

      setMessage("Profile saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Unexpected save error:", err);
      setError("Unexpected error while saving. See console.");
    } finally {
      setSaving(false);
    }
  };

  // Emergency contacts handlers (unchanged)
  const toggleNewContactForm = () => {
    setContactsError("");
    setShowNewContactForm((s) => !s);
  };

  const handleNewContactChange = (k: keyof EmergencyContact, v: string) => {
    setNewContact((p) => ({ ...p, [k]: v }));
  };

  const handleAddContact = async () => {
    setContactsError("");
    if (!newContact.name || !newContact.mobile) {
      setContactsError("Name and Mobile are required for emergency contact.");
      return;
    }
    if (!profile.employeeId) {
      setContactsError("Employee ID not known. Save profile first.");
      return;
    }

    setAddingContact(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const url = `${API_BASE}/employee/${encodeURIComponent(profile.employeeId)}/emergency-contacts`;

      const body = {
        name: newContact.name,
        email: newContact.email ?? "",
        mobile: newContact.mobile ?? "",
        address: newContact.address ?? "",
        relationship: newContact.relationship ?? "",
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Add contact failed:", res.status, json);
        setContactsError(json?.error || `Add contact failed (${res.status})`);
        setAddingContact(false);
        return;
      }

      setEmergencyContacts((prev) => [...prev, json]);
      setNewContact({ name: "", email: "", mobile: "", address: "", relationship: "" });
      setShowNewContactForm(false);
    } catch (err) {
      console.error("Unexpected add contact error:", err);
      setContactsError("Unexpected error while adding contact. See console.");
    } finally {
      setAddingContact(false);
    }
  };

  // Documents handlers
  const onPickDocFile = () => docFileRef.current?.click();

  const handleDocFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setDocPreviewFile(null);
      setDocPreviewUrl("");
      return;
    }
    setDocPreviewFile(f);
    // For image types show preview, otherwise just show filename (we still upload)
    if (f.type.startsWith("image/")) {
      setDocPreviewUrl(URL.createObjectURL(f));
    } else {
      setDocPreviewUrl("");
    }
  };

  const handleUploadDocument = async () => {
    setDocUploadError("");
    if (!docPreviewFile) {
      setDocUploadError("Please choose a file to upload.");
      return;
    }
    if (!profile.employeeId) {
      setDocUploadError("Employee ID not known. Save profile first.");
      return;
    }

    setDocUploading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const url = `${API_BASE}/employee/${encodeURIComponent(profile.employeeId)}/documents`;
      const fd = new FormData();
      fd.append("file", docPreviewFile);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set content-type
        },
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Document upload failed:", res.status, json);
        setDocUploadError(json?.error || `Upload failed (${res.status})`);
        setDocUploading(false);
        return;
      }

      // append to documents list
      setDocuments((prev) => [...prev, json]);
      // clear preview/file
      setDocPreviewFile(null);
      setDocPreviewUrl("");
    } catch (err) {
      console.error("Unexpected document upload error:", err);
      setDocUploadError("Unexpected error while uploading document. See console.");
    } finally {
      setDocUploading(false);
    }
  };

  /**
   * DELETE document using API:
   * DELETE https://erp.skavosystem.com/employee/{{empId}}/documents/{{docId}}
   */
  const handleDeleteDocument = async (docId?: number) => {
    setDocActionError("");
    if (!docId) {
      setDocActionError("Invalid document id.");
      return;
    }

    // confirmation
    const ok = confirm("Are you sure you want to delete this document?");
    if (!ok) return;

    if (!profile.employeeId) {
      setDocActionError("Employee ID not known. Save profile first.");
      return;
    }

    // mark deleting
    setDeletingDocIds((prev) => [...prev, docId]);

    try {
      const token = localStorage.getItem("accessToken") || "";
      const url = `${API_BASE}/employee/${encodeURIComponent(profile.employeeId)}/documents/${encodeURIComponent(docId)}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error("Delete failed:", res.status, json);
        setDocActionError(json?.error || `Delete failed (${res.status})`);
        // unmark deleting
        setDeletingDocIds((prev) => prev.filter((id) => id !== docId));
        return;
      }

      // remove from local list on success
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error("Unexpected delete error:", err);
      setDocActionError("Unexpected error while deleting document. See console.");
    } finally {
      // unmark deleting
      setDeletingDocIds((prev) => prev.filter((id) => id !== docId));
    }
  };

  /**
   * Download helper:
   * - Tries to fetch file as blob (with Authorization header).
   * - Programmatically creates an <a> with blob URL and triggers download.
   * - Falls back to opening URL in new tab when fetch fails (CORS / blocked).
   */
  const handleDownload = async (url?: string, filename?: string) => {
    if (!url) {
      setDocActionError("No file URL available to download.");
      return;
    }
    setDocActionError("");
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        // fallback: open in new tab when fetch returns not-ok (e.g., 403)
        window.open(url, "_blank");
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || url.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      console.error("Download failed, opening in new tab:", err);
      // fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">Profile Details</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm">
          {/* Profile picture */}
          <div className="mb-6">
            <div className="text-sm font-medium text-slate-700 mb-2">Profile Picture</div>
            <div
              onClick={onPickFile}
              className="border rounded-md h-36 flex items-center justify-center cursor-pointer bg-white hover:bg-gray-50"
            >
              {preview ? (
                <div className="flex items-center gap-4 px-4">
                  <img src={preview} alt="profile preview" className="h-24 w-24 object-cover rounded-full border" />
                  <div className="text-sm text-slate-600">Click to change picture</div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
                    <path d="M12 3v10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10l5-5 5 5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm">Choose a file</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Grid of fields similar to screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium text-slate-700">Your Name <span className="text-red-500">*</span></label>
              <Input value={profile.name || ""} onChange={(e) => handleInput("name", e.target.value)} placeholder="--" className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Date of Birth</label>
              <Input type="date" value={profile.birthday ?? ""} onChange={(e) => handleInput("birthday", e.target.value)} className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <select value={profile.gender ?? ""} onChange={(e) => handleInput("gender", e.target.value)} className="mt-1 block w-full border rounded-md h-11 px-3">
                <option value="">--</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Blood Group</label>
              <select value={profile.bloodGroup ?? ""} onChange={(e) => handleInput("bloodGroup", e.target.value)} className="mt-1 block w-full border rounded-md h-11 px-3">
                <option value="">--</option>
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email Id <span className="text-red-500">*</span></label>
              <Input type="email" value={profile.email || ""} onChange={(e) => handleInput("email", e.target.value)} placeholder="--" className="mt-1" />
              <p className="text-xs text-slate-400 mt-1">Must have at least 8 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Slack Member Id</label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-slate-600">@</span>
                <input value={profile.slackMemberId ?? ""} onChange={(e) => handleInput("slackMemberId", e.target.value)} className="border rounded-r-md h-11 px-3 w-full" placeholder="--" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Marital Status</label>
              <select value={profile.maritalStatus ?? ""} onChange={(e) => handleInput("maritalStatus", e.target.value)} className="mt-1 block w-full border rounded-md h-11 px-3">
                <option value="">--</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Language</label>
              <select value={profile.language ?? ""} onChange={(e) => handleInput("language", e.target.value)} className="mt-1 block w-full border rounded-md h-11 px-3">
                <option value="">--</option>
                <option value="French">French</option>
                <option value="English">English</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Country</label>
              <select value={profile.country ?? "usa"} onChange={(e) => handleInput("country", e.target.value)} className="mt-1 block w-full border rounded-md h-11 px-3">
                <option>usa</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Australia</option>
                <option>Other</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-1 lg:col-span-1">
              <label className="text-sm font-medium text-slate-700">Mobile</label>
              <div className="flex mt-1">
                <div className="inline-flex items-center px-3 border rounded-l-md bg-gray-50 text-slate-600">+370</div>
                <input value={profile.mobile ?? ""} onChange={(e) => handleInput("mobile", e.target.value)} className="border rounded-r-md h-11 px-3 w-full" placeholder="--" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <Textarea value={profile.address ?? ""} onChange={(e) => handleInput("address", e.target.value)} className="mt-1 h-20" placeholder="--" />
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">About</label>
            <Textarea value={profile.about ?? ""} onChange={(e) => handleInput("about", e.target.value)} className="mt-1 h-28" placeholder="--" />
          </div>

          {/* message / error */}
          <div className="mt-4">
            {message && (
              <Alert className="bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">{message}</AlertDescription>
                </div>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Save button */}
          <div className="mt-6 flex justify-center gap-4">
            {/* <Button variant="outline" onClick={() => { window.location.href = "/employees/settings"; }}>Cancel</Button> */}
            <Button type="submit" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Emergency Details Section */}

        <EmergencyContactsSection
          employeeId={profile.employeeId}
        />


        {/* Documents Section (ADDED) */}

        {/* <div className="mt-6 text-center text-sm text-slate-500">
          <Link href="/settings" className="underline">Back to settings</Link>
        </div> */}
      </div>





    </div>
  );
}
