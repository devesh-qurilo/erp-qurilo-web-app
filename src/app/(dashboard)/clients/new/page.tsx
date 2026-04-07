"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import ClientDetailPage from "../[id]/page"
import { CommonNavbar } from "@/components/Navbar"

const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`


export default function AddClientDetails() {
  const router = useRouter()

  // Personal
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [country, setCountry] = useState("")
  const [gender, setGender] = useState("")
  const [language, setLanguage] = useState("")
  const [receiveEmail, setReceiveEmail] = useState(false)

  // Category/subcategory (value = name)
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")

  // Company
  const [companyName, setCompanyName] = useState("")
  const [website, setWebsite] = useState("")
  const [officePhone, setOfficePhone] = useState("")
  const [taxName, setTaxName] = useState("")
  const [gstVatNo, setGstVatNo] = useState("")
  const [address, setAddress] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [city, setCity] = useState("")
  const [stateVal, setStateVal] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [skype, setSkype] = useState("")
  const [linkedIn, setLinkedIn] = useState("")
  const [twitter, setTwitter] = useState("")
  const [facebook, setFacebook] = useState("")

  // files + previews
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>("")
  const [logoPreview, setLogoPreview] = useState<string>("")

  // UI + validation
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // category lists + modals
  const [categories, setCategories] = useState<{ id: number; categoryName: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ id: number; subCategoryName: string }[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newSubCategoryName, setNewSubCategoryName] = useState("")

  // placeholder image (from your upload)
  const placeholderImg = "/mnt/data/Screenshot 2025-11-25 120245.png"

  // hide global navbar while mounted (best-effort)
  useEffect(() => {
    const selectors = ["nav.fixed", ".common-navbar", "header", "[data-navbar]"]
    const found: Array<{ el: Element; original: string | null }> = []
    selectors.forEach((sel) => {
      const el = document.querySelector(sel)
      if (el) {
        const orig = (el as HTMLElement).style.display || null
        found.push({ el, original: orig })
          ; (el as HTMLElement).style.display = "none"
      }
    })
    return () => found.forEach(({ el, original }) => ((el as HTMLElement).style.display = original ?? ""))
  }, [])







  const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` })

  // fetch lists
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients/category`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error("Failed to load categories")
      const data = await res.json()
      setCategories((Array.isArray(data) ? data : []).map((item: any) => ({ id: item.id, categoryName: item.categoryName || item.name || "" })))
    } catch (e) { console.error(e) }
  }
  const fetchSubcategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients/category/subcategory`, { headers: getAuthHeader() })
      if (!res.ok) throw new Error("Failed to load subcategories")
      const data = await res.json()
      setSubcategories((Array.isArray(data) ? data : []).map((item: any) => ({ id: item.id, subCategoryName: item.subCategoryName || item.name || "" })))
    } catch (e) { console.error(e) }
  }
  useEffect(() => { fetchCategories(); fetchSubcategories() }, [])

  // previews
  const readPreview = (file: File, setter: (s: string) => void) => {
    const r = new FileReader()
    r.onloadend = () => setter(r.result as string)
    r.readAsDataURL(file)
  }
  const onProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setProfileFile(f); if (f) readPreview(f, setProfilePreview); else setProfilePreview("")
  }
  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setLogoFile(f); if (f) readPreview(f, setLogoPreview); else setLogoPreview("")
  }

  // validation & submit
  const validateForm = () => {
    const newErr: Record<string, string> = {}
    if (!name.trim()) newErr.name = "Name is required"
    if (!email.trim()) newErr.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) newErr.email = "Invalid email"
    if (!mobile.trim()) newErr.mobile = "Mobile is required"
    if (!country.trim()) newErr.country = "Country is required"
    if (!companyName.trim()) newErr.companyName = "Company name is required"
    setErrors(newErr)
    return Object.keys(newErr).length === 0
  }

  const clearMessage = () => { setMessage(""); setMessageType("") }

  // debug helper
  const debugLog = (label: string, obj: any) => {
    // try { console.log(label, obj) } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessage()
    if (!validateForm()) { setMessage("Please fix errors"); setMessageType("error"); return }
    setIsSubmitting(true)

    const client = {
      name, email, mobile, country, gender, category, subCategory, language, receiveEmail,
      skype, linkedIn, twitter, facebook,
      company: { companyName, website, officePhone, taxName, gstVatNo, address, city, state: stateVal, postalCode, shippingAddress }
    }

    const fd = new FormData()
    fd.append("client", JSON.stringify(client))
    if (profileFile) fd.append("profilePicture", profileFile)
    if (logoFile) fd.append("companyLogo", logoFile)

    try {
      const res = await fetch(`${API_BASE}/clients`, {
        method: "POST",
        headers: {
          // do NOT set Content-Type for FormData (browser will set boundary)
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: fd
      })

      // try parse response
      let data: any = null
      try { data = await res.json() } catch (err) { debugLog("Failed to parse JSON response", err) }

      debugLog("POST /clients status", res.status)
      debugLog("POST /clients body", data)

      if (!res.ok) {
        const errMsg = data?.error || data?.message || `Request failed (${res.status})`
        throw new Error(errMsg)
      }

      setMessage("Client created successfully")
      setMessageType("success")

      // set a refresh flag so clients list can re-fetch
      try { localStorage.setItem("clients:refresh", String(Date.now())) } catch { }

      window.dispatchEvent(new Event("clients:refresh"));

      // if backend returns new id, go to detail page, else to list
      const newId = data?.id ?? data?.clientId ?? data?.client?.id ?? null

      // small delay to allow user see success message
      setTimeout(() => {
        if (newId) router.push(`/clients`)
        else router.push("/clients")
      }, 600)

      // reset form values
      setTimeout(resetForm, 1200)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Request failed")
      setMessageType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName(""); setEmail(""); setMobile(""); setCountry(""); setGender(""); setCategory(""); setSubCategory(""); setLanguage(""); setReceiveEmail(false)
    setCompanyName(""); setWebsite(""); setOfficePhone(""); setTaxName(""); setGstVatNo(""); setAddress(""); setShippingAddress(""); setCity(""); setStateVal(""); setPostalCode("")
    setSkype(""); setLinkedIn(""); setTwitter(""); setFacebook("")
    setProfileFile(null); setLogoFile(null); setProfilePreview(""); setLogoPreview(""); setErrors({}); clearMessage()
  }

  // add category/subcategory
  const saveCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const res = await fetch(`${API_BASE}/clients/category`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName: newCategoryName.trim() }),
      })
      if (!res.ok) throw new Error("Failed to save category")
      const created = await res.json()
      await fetchCategories()
      setCategory(created?.categoryName ?? created?.name ?? newCategoryName.trim())
      setNewCategoryName(""); setShowCategoryModal(false)
    } catch (e) { console.error(e); alert("Could not save category") }
  }

  const saveSubCategory = async () => {
    if (!newSubCategoryName.trim()) return
    try {
      const res = await fetch(`${API_BASE}/clients/category/subcategory`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ subCategoryName: newSubCategoryName.trim() }),
      })
      if (!res.ok) throw new Error("Failed to save subcategory")
      const created = await res.json()
      await fetchSubcategories()
      setSubCategory(created?.subCategoryName ?? created?.name ?? newSubCategoryName.trim())
      setNewSubCategoryName(""); setShowSubCategoryModal(false)
    } catch (e) { console.error(e); alert("Could not save subcategory") }
  }

  const pickCategory = (c: { id: number; categoryName: string }) => { setCategory(c.categoryName); setShowCategoryModal(false) }
  const pickSubCategory = (s: { id: number; subCategoryName: string }) => { setSubCategory(s.subCategoryName); setShowSubCategoryModal(false) }

  const deleteCategory = async (id: number) => { if (!confirm("Delete category?")) return; try { await fetch(`${API_BASE}/clients/category/${id}`, { method: "DELETE", headers: getAuthHeader() }); await fetchCategories() } catch { alert("Could not delete") } }
  const deleteSubcategory = async (id: number) => { if (!confirm("Delete subcategory?")) return; try { await fetch(`${API_BASE}/clients/category/subcategory/${id}`, { method: "DELETE", headers: getAuthHeader() }); await fetchSubcategories() } catch { alert("Could not delete") } }

  const inputClass = (err?: boolean) => `w-full px-3 py-2 rounded-md border transition focus:outline-none ${err ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-200 bg-white focus:border-gray-300 focus:ring-0"}`

  const handleClose = () => router.push("/clients")

  return (
    <div className="min-h-screen  bg-slate-50 flex items-start justify-center mb-5 py-12">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b  bg-gray-50">
          <h3 className="text-lg font-medium text-slate-900">Add Client Details</h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-700"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`rounded-md p-3 ${messageType === "success" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"} flex items-start gap-3`}>
              {messageType === "success" ? <CheckCircle className="text-emerald-600" /> : <AlertCircle className="text-red-600" />}
              <div className="text-sm font-medium">{message}</div>
              <button type="button" onClick={clearMessage} className="ml-auto text-slate-400"><X /></button>
            </div>
          )}

          {/* Account Details */}
          <div className="rounded-lg border border-slate-200 p-5">
            <h4 className="text-sm font-semibold mb-4 text-slate-800">Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Client Name *</label>
                    <input value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }) }} className={inputClass(Boolean(errors.name))} placeholder="John Doe" />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Email *</label>
                    <input value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }) }} className={inputClass(Boolean(errors.email))} placeholder="asdf@gmail.com" />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Mobile Number *</label>
                    <input value={mobile} onChange={(e) => { setMobile(e.target.value); if (errors.mobile) setErrors({ ...errors, mobile: "" }) }} className={inputClass(Boolean(errors.mobile))} placeholder="370370" />
                    {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        if (errors.country) setErrors({ ...errors, country: "" });
                      }}
                      className={inputClass(Boolean(errors.country))}
                    >
                      <option value="">Select Country</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Italy">Italy</option>
                      <option value="Spain">Spain</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Norway">Norway</option>
                      <option value="Denmark">Denmark</option>
                      <option value="Finland">Finland</option>
                      <option value="Japan">Japan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Singapore">Singapore</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Mexico">Mexico</option>
                    </select>
                    {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass()}>
                      <option value="">--</option><option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>

                  {/* === MATCHED UI: pill container with select left and Add right === */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Client Category</label>
                    <div className="flex items-center rounded-full border border-slate-200 overflow-hidden">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="appearance-none px-4 py-2 w-full border-none rounded-none focus:outline-none"
                      >
                        <option value="">--</option>
                        {categories.map((c) => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setShowCategoryModal(true); setNewCategoryName("") }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-r-full border-l border-slate-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Sub Category</label>
                    <div className="flex items-center rounded-full border border-slate-200 overflow-hidden">
                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="appearance-none px-4 py-2 w-full border-none rounded-none focus:outline-none"
                      >
                        <option value="">--</option>
                        {subcategories.map((s) => <option key={s.id} value={s.subCategoryName}>{s.subCategoryName}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setShowSubCategoryModal(true); setNewSubCategoryName("") }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-r-full border-l border-slate-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass()}>
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Russian">Russian</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Korean">Korean</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Receive Email Notifications ?</label>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2"><input type="radio" name="receive" checked={receiveEmail} onChange={() => setReceiveEmail(true)} /> Yes</label>
                      <label className="flex items-center gap-2"><input type="radio" name="receive" checked={!receiveEmail} onChange={() => setReceiveEmail(false)} /> No</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* right column: profile picture */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">Profile Picture</label>
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-center">
                  <input id="profile" type="file" accept="image/*" onChange={onProfileChange} className="hidden" />
                  <label htmlFor="profile" className="cursor-pointer block">
                    <div className="mx-auto mb-3 h-28 w-full max-w-xs">
                      {profilePreview ? <img src={profilePreview} alt="preview" className="mx-auto h-28 w-28 rounded-md object-cover" /> : <img src={placeholderImg} alt="placeholder" className="mx-auto h-28 w-28 rounded-md object-cover" />}
                    </div>
                    <div className="text-sm text-slate-500">Choose a file</div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Company details block (unchanged) */}
          <div className="rounded-lg border border-slate-200 p-5">
            <h4 className="text-sm font-semibold mb-4 text-slate-800">Company Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Company Name *</label>
                <input value={companyName} onChange={(e) => { setCompanyName(e.target.value); if (errors.companyName) setErrors({ ...errors, companyName: "" }) }} className={inputClass(Boolean(errors.companyName))} placeholder="--" />
                {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>}
              </div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Official Website</label><input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass()} placeholder="--" /></div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Office Phone Number</label><input value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} className={inputClass()} placeholder="--" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
              <div><label className="text-xs">Tax Name</label><input value={taxName} onChange={(e) => setTaxName(e.target.value)} className={inputClass()} placeholder="e.g. Tax" /></div>
              <div><label className="text-xs">Tax No.</label><input value={gstVatNo} onChange={(e) => setGstVatNo(e.target.value)} className={inputClass()} placeholder="--" /></div>
              <div><label className="text-xs">City</label><input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass()} placeholder="--" /></div>
              <div><label className="text-xs">State</label><input value={stateVal} onChange={(e) => setStateVal(e.target.value)} className={inputClass()} placeholder="--" /></div>
              <div className="md:col-span-2"><label className="text-xs">Postal Code</label><input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass()} placeholder="--" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div><label className="text-xs font-medium mb-1 block">Company Address</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-200" rows={4} /></div>
              <div><label className="text-xs font-medium mb-1 block">Shipping Address</label><textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-200" rows={4} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <input value={skype} onChange={(e) => setSkype(e.target.value)} className={inputClass()} placeholder="Skype" />
              <input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} className={inputClass()} placeholder="LinkedIn" />
              <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className={inputClass()} placeholder="Twitter" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
              <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className={inputClass()} placeholder="Facebook" />
              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">Company Logo</label>
                <div className="rounded-md border border-dashed border-slate-300 p-3 text-center">
                  <input id="logo" type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                  <label htmlFor="logo" className="cursor-pointer block">
                    <div className="mb-2 h-24">{logoPreview ? <img src={logoPreview} alt="logo" className="mx-auto h-24 object-contain" /> : <img src={placeholderImg} alt="logo-placeholder" className="mx-auto h-24 object-contain" />}</div>
                    <div className="text-sm text-slate-500">Choose a file</div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex justify-center gap-4">
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-md border bg-white text-slate-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-md bg-blue-600 text-white flex items-center gap-2">
              {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {isSubmitting ? "Adding..." : "Add Client"} <ArrowRight />
            </button>
          </div>
        </form>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-medium">Client Category</h4>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-500"><X /></button>
            </div>

            <div className="p-4">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-left">
                    <th className="p-3 text-sm">#</th>
                    <th className="p-3 text-sm">Category Name</th>
                    <th className="p-3 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 text-sm">{i + 1}</td>
                      <td className="p-3 text-sm cursor-pointer" onClick={() => pickCategory(c)}>{c.categoryName}</td>
                      <td className="p-3 text-sm text-center"><button onClick={() => deleteCategory(c.id)} className="text-red-600">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4">
                <label className="text-sm block mb-1">Category Name *</label>
                <input className="w-full px-3 py-2 rounded-md border border-slate-200" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="--" />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button onClick={saveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubCategory Modal */}
      {showSubCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-medium">Client Sub Category</h4>
              <button onClick={() => setShowSubCategoryModal(false)} className="text-slate-500"><X /></button>
            </div>

            <div className="p-4">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-left">
                    <th className="p-3 text-sm">#</th>
                    <th className="p-3 text-sm">Category Name</th>
                    <th className="p-3 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subcategories.map((s, i) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3 text-sm">{i + 1}</td>
                      <td className="p-3 text-sm cursor-pointer" onClick={() => pickSubCategory(s)}>{s.subCategoryName}</td>
                      <td className="p-3 text-sm text-center"><button onClick={() => deleteSubcategory(s.id)} className="text-red-600">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4">
                <label className="text-sm block mb-1">Sub Category Name *</label>
                <input className="w-full px-3 py-2 rounded-md border border-slate-200" value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="--" />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowSubCategoryModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button onClick={saveSubCategory} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}




      <CommonNavbar />
    </div>
  )
}









