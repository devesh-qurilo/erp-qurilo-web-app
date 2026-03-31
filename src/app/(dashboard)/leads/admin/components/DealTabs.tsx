"use client";

import { useEffect, useRef, useState } from "react";
import { Deal } from "@/types/deals";
import { format } from "date-fns";

type DocumentItem = {
    id: number;
    filename: string;
    url: string;
    uploadedAt: string;
};

type Followup = {
    id?: number;
    nextDate: string; // yyyy-mm-dd
    startTime: string; // HH:mm
    remarks?: string;
    sendReminder?: boolean;
    remindBefore?: number;
    remindUnit?: "DAYS" | "HOURS" | "MINUTES" | string;
    status?: "PENDING" | "CANCELLED" | "COMPLETED" | string;
};

type Employee = {
    employeeId: string;
    name: string;
    designation?: string;
    department?: string;
    profileUrl?: string;
};

type NoteItem = {
    id?: number;
    noteTitle: string;
    noteType: "PUBLIC" | "PRIVATE" | string;
    noteDetails?: string;
    createdBy?: string;
    createdAt?: string;
};

type TagItem = {
    id?: number;
    tagName: string;
};

type TabKey = "files" | "followups" | "people" | "notes" | "comments" | "tags";

const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}`;
const UPLOADED_LOCAL_PATH = "/mnt/data/Screenshot 2025-11-22 120859.png";

type DealTabsProps = {
    dealId: string;
    deal: Deal;
    onDealUpdated?: () => Promise<void> | void;
};

export default function DealTabs({ dealId, deal, onDealUpdated }: DealTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("files");

    // documents state & employees who can access the docs
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [docEmployeeIds, setDocEmployeeIds] = useState<string[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [docsError, setDocsError] = useState<string | null>(null);

    // file picker states
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // followups state
    const [followups, setFollowups] = useState<Followup[]>([]);
    const [followupsLoading, setFollowupsLoading] = useState(false);
    const [followupsError, setFollowupsError] = useState<string | null>(null);

    // followup modal state
    const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
    const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);
    const [followupSaving, setFollowupSaving] = useState(false);

    // people (employees) state & modal
    const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState<string | null>(null);
    const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);

    // available pool & departments for the Add People form
    const [allEmployeesPool, setAllEmployeesPool] = useState<Employee[]>([]);
    const [availableToAdd, setAvailableToAdd] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedAddEmployeeId, setSelectedAddEmployeeId] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string>(""); // "" = All
    const [peopleSaving, setPeopleSaving] = useState(false);
    const [peopleDeletingId, setPeopleDeletingId] = useState<string | null>(null);
    const [peopleSearch, setPeopleSearch] = useState<string>("");

    // notes state
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);

    // notes modal & mode
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteModalMode, setNoteModalMode] = useState<"add" | "edit" | "view">("add");
    const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteDeletingId, setNoteDeletingId] = useState<number | null>(null);

    // tags state
    const [tags, setTags] = useState<(TagItem | string)[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsError, setTagsError] = useState<string | null>(null);
    const [isAddTagOpen, setIsAddTagOpen] = useState(false);
    const [tagValue, setTagValue] = useState<string>("");
    const [tagSaving, setTagSaving] = useState(false);
    const [tagDeletingId, setTagDeletingId] = useState<number | null>(null);

    // Comments modal (UI) state
    const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentSaving, setCommentSaving] = useState(false);
    const [commentDeletingId, setCommentDeletingId] = useState<number | null>(null);

    // centralized action menu state to avoid overlap + easy click-away
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

    // ---- FETCHERS ----

    // fetch documents list & employeeIds
    useEffect(() => {
        if (!dealId) return;
        const fetchDocs = async () => {
            setDocsLoading(true);
            setDocsError(null);
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    setDocsError("No access token found");
                    setDocsLoading(false);
                    return;
                }

                const res = await fetch(`${BASE_URL}/deals/${dealId}/documents`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed to fetch documents: ${res.status} ${txt}`);
                }

                const json = await res.json();
                if (Array.isArray(json)) {
                    setDocuments(json);
                } else {
                    if (Array.isArray(json.employeeIds)) setDocEmployeeIds(json.employeeIds);
                    if (Array.isArray((json as any).documents)) setDocuments((json as any).documents);
                }
            } catch (err: any) {
                console.error(err);
                setDocsError(err.message || "Failed to load documents");
            } finally {
                setDocsLoading(false);
            }
        };

        fetchDocs();
    }, [dealId]);

    // fetch followups
    useEffect(() => {
        if (!dealId) return;
        const fetchFollowups = async () => {
            setFollowupsLoading(true);
            setFollowupsError(null);
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    setFollowupsError("No access token found");
                    setFollowupsLoading(false);
                    return;
                }
                const res = await fetch(`${BASE_URL}/deals/${dealId}/followups`, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed to fetch followups: ${res.status} ${txt}`);
                }
                const json = await res.json();
                if (Array.isArray(json)) setFollowups(json);
            } catch (err: any) {
                console.error(err);
                setFollowupsError(err.message || "Failed to load followups");
            } finally {
                setFollowupsLoading(false);
            }
        };

        fetchFollowups();
    }, [dealId]);

    // fetch assigned employees
    const fetchAssignedEmployees = async () => {
        if (!dealId) return;
        setEmployeesLoading(true);
        setEmployeesError(null);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setEmployeesError("No access token found");
                setEmployeesLoading(false);
                return;
            }

            const res = await fetch(`${BASE_URL}/deals/${dealId}/employees`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to fetch employees: ${res.status} ${txt}`);
            }

            const json = await res.json();
            if (Array.isArray(json)) {
                setAssignedEmployees(json);
            } else if (Array.isArray((json as any).employees)) {
                setAssignedEmployees((json as any).employees);
            } else {
                setAssignedEmployees([]);
            }
        } catch (err: any) {
            console.error(err);
            setEmployeesError(err.message || "Failed to load employees");
        } finally {
            setEmployeesLoading(false);
        }
    };

    useEffect(() => {
        if (!dealId) return;
        fetchAssignedEmployees();
    }, [dealId]);

    // fetch notes list
    const fetchNotes = async () => {
        if (!dealId) return;
        setNotesLoading(true);
        setNotesError(null);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setNotesError("No access token found");
                setNotesLoading(false);
                return;
            }
            const res = await fetch(`${BASE_URL}/deals/${dealId}/notes`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to fetch notes: ${res.status} ${txt}`);
            }
            const json = await res.json();
            if (Array.isArray(json)) setNotes(json);
            else setNotes([]);
        } catch (err: any) {
            console.error(err);
            setNotesError(err.message || "Failed to load notes");
        } finally {
            setNotesLoading(false);
        }
    };

    useEffect(() => {
        if (!dealId) return;
        fetchNotes();
    }, [dealId]);

    // fetch tags list
    const fetchTags = async () => {
        if (!dealId) return;
        setTagsLoading(true);
        setTagsError(null);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setTagsError("No access token found");
                setTagsLoading(false);
                return;
            }
            const res = await fetch(`${BASE_URL}/deals/${dealId}/tags`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to fetch tags: ${res.status} ${txt}`);
            }
            const json = await res.json();

            // server might return either array of objects or array of strings
            if (Array.isArray(json)) {
                setTags(json); // keep raw array (could be string[] or TagItem[])
            } else {
                setTags([]);
            }
        } catch (err: any) {
            console.error(err);
            setTagsError(err.message || "Failed to load tags");
        } finally {
            setTagsLoading(false);
        }
    };

    useEffect(() => {
        if (!dealId) return;
        fetchTags();
    }, [dealId]);

    // When Add People modal opens we fetch assigned employees, departments and employee pool.
    const openAddPeopleModal = async () => {
        setIsAddPeopleOpen(true);
        setSelectedDepartment(""); // default to all departments
        setSelectedAddEmployeeId(null);
        setPeopleSaving(false);
        setEmployeesError(null);

        await fetchAssignedEmployees();

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setEmployeesError("No access token found");
                return;
            }

            const depRes = await fetch(`${BASE_URL}/admin/departments`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!depRes.ok) {
                console.warn("Failed to fetch departments", depRes.statusText);
            } else {
                const depJson = await depRes.json();
                if (Array.isArray(depJson)) {
                    const names = depJson
                        .map((d: any) =>
                            typeof d === "string" ? d : d.name || d.department || ""
                        )
                        .filter(Boolean);
                    setDepartments(names);
                }
            }

            const empRes = await fetch(`${BASE_URL}/employee/all?page=0&size=2000`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });

            if (!empRes.ok) {
                console.warn("Failed to fetch employee pool", empRes.statusText);
            } else {
                const empJson = await empRes.json();
                let pool: Employee[] = [];
                if (Array.isArray(empJson)) {
                    pool = empJson;
                } else if (Array.isArray(empJson.content)) {
                    pool = empJson.content;
                } else if (Array.isArray((empJson as any).employees)) {
                    pool = (empJson as any).employees;
                } else if (typeof empJson === "object") {
                    pool = Object.values(empJson).flat?.() ?? [];
                }

                const normalized = (pool as any[])
                    .map((p) => ({
                        employeeId: p.employeeId ?? p.id ?? p.empId ?? p.employee_id ?? "",
                        name: p.name ?? p.fullName ?? p.employeeName ?? "",
                        department: p.department ?? p.dept ?? p.departmentName ?? "",
                        designation: p.designation ?? p.title ?? "",
                        profileUrl: p.profileUrl ?? p.avatar ?? "",
                    }))
                    .filter((p) => p.employeeId && p.name);

                setAllEmployeesPool(normalized);

                // remove already assigned employees from available list
                const assignedIds = new Set(assignedEmployees.map((a) => a.employeeId));
                const filtered = normalized.filter((p) => !assignedIds.has(p.employeeId));
                setAvailableToAdd(filtered);
                setSelectedAddEmployeeId(filtered.length > 0 ? filtered[0].employeeId : null);
            }
        } catch (err: any) {
            console.error("Error loading add-people resources", err);
            setEmployeesError("Failed to load available employees / departments");
        }
    };

    const closeAddPeopleModal = () => {
        setIsAddPeopleOpen(false);
        setSelectedAddEmployeeId(null);
        setAvailableToAdd([]);
        setPeopleSaving(false);
        setPeopleDeletingId(null);
        setPeopleSearch("");
        setSelectedDepartment("");
    };

    // When department changes, recompute availableToAdd (client-side filter).
    useEffect(() => {
        if (!isAddPeopleOpen) return;
        const assignedIds = new Set(assignedEmployees.map((a) => a.employeeId));
        let pool = allEmployeesPool.filter((p) => !assignedIds.has(p.employeeId));
        if (selectedDepartment && selectedDepartment !== "") {
            pool = pool.filter(
                (p) => (p.department || "").toLowerCase() === selectedDepartment.toLowerCase()
            );
        }
        setAvailableToAdd(pool);
        setSelectedAddEmployeeId(pool.length > 0 ? pool[0].employeeId : null);
    }, [selectedDepartment, allEmployeesPool, assignedEmployees, isAddPeopleOpen]);

    // add employee (POST)
    const addEmployee = async () => {
        if (!dealId) return;
        if (!selectedAddEmployeeId) {
            alert("Select an employee to add");
            return;
        }
        setPeopleSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setPeopleSaving(false);
                return;
            }

            const payload = { employeeIds: [selectedAddEmployeeId] };

            const res = await fetch(`${BASE_URL}/deals/${dealId}/employees`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to add employee: ${res.status} ${txt}`);
            }

            // After success, refetch assigned list
            await fetchAssignedEmployees();

            // refresh availableToAdd: remove newly added
            setAvailableToAdd((prev) => prev.filter((p) => p.employeeId !== selectedAddEmployeeId));
            setSelectedAddEmployeeId(null);

            // close modal for cleaner UX
            setIsAddPeopleOpen(false);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to add employee");
        } finally {
            setPeopleSaving(false);
        }
    };

    // delete employee (DELETE to specified endpoint)
    const removeEmployee = async (employeeId?: string) => {
        if (!dealId || !employeeId) return;
        if (!confirm("Are you sure you want to remove this person from the deal?")) return;
        setPeopleDeletingId(employeeId);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setPeopleDeletingId(null);
                return;
            }

            const res = await fetch(`${BASE_URL}/deals/${dealId}/employees/${employeeId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to remove employee: ${res.status} ${txt}`);
            }

            // after success, refetch assigned employees
            await fetchAssignedEmployees();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to remove employee");
        } finally {
            setPeopleDeletingId(null);
        }
    };

    // Followups handlers
    const openAddFollowup = () => {
        setEditingFollowup({
            nextDate: "",
            startTime: "",
            remarks: "",
            sendReminder: true,
            remindBefore: 1,
            remindUnit: "DAYS",
            status: "PENDING",
        });
        setIsFollowupModalOpen(true);
    };

    const openEditFollowup = (f: any) => {
        setEditingFollowup({
            id: f.id,
            nextDate: f.nextDate ? f.nextDate.split("T")[0] : f.nextDate || "",
            startTime: f.startTime ? f.startTime.slice(0, 5) : f.startTime || "",
            remarks: f.remarks || "",
            sendReminder: !!f.sendReminder,
            remindBefore: f.remindBefore ?? 1,
            remindUnit: f.remindUnit ?? "DAYS",
            status: f.status ?? "PENDING",
        });
        setIsFollowupModalOpen(true);
    };

    const closeFollowupModal = () => {
        setIsFollowupModalOpen(false);
        setEditingFollowup(null);
    };

    const saveFollowup = async () => {
        if (!editingFollowup) return;
        setFollowupSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setFollowupSaving(false);
                return;
            }

            const payload: any = {
                nextDate: editingFollowup.nextDate,
                startTime: editingFollowup.startTime,
                remarks: editingFollowup.remarks,
                sendReminder: editingFollowup.sendReminder,
                remindBefore: editingFollowup.remindBefore,
                remindUnit: editingFollowup.remindUnit,
            };

            if (editingFollowup.status) payload.status = editingFollowup.status;

            if (editingFollowup.id) {
                const res = await fetch(
                    `${BASE_URL}/deals/${dealId}/followups/${editingFollowup.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed to update followup: ${res.status} ${txt}`);
                }
                const updated = await res.json();
                setFollowups((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            } else {
                const res = await fetch(`${BASE_URL}/deals/${dealId}/followups`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed to create followup: ${res.status} ${txt}`);
                }
                const created = await res.json();
                setFollowups((prev) => [created, ...prev]);
            }

            closeFollowupModal();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to save followup");
        } finally {
            setFollowupSaving(false);
        }
    };

    const deleteFollowup = async (id?: number) => {
        if (!id) return;
        if (!confirm("Are you sure you want to delete this follow up?")) return;
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                return;
            }
            const res = await fetch(`${BASE_URL}/deals/${dealId}/followups/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to delete followup: ${res.status} ${txt}`);
            }
            setFollowups((prev) => prev.filter((f) => f.id !== id));
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to delete followup");
        }
    };

    // --- NOTES modals and operations
    const openAddNote = () => {
        setNoteModalMode("add");
        setEditingNote({
            noteTitle: "",
            noteType: "PUBLIC",
            noteDetails: "",
        });
        setIsNoteModalOpen(true);
    };

    const openViewNote = (n: NoteItem) => {
        setNoteModalMode("view");
        setEditingNote(n);
        setIsNoteModalOpen(true);
    };

    const openEditNote = (n: NoteItem) => {
        setNoteModalMode("edit");
        setEditingNote(n);
        setIsNoteModalOpen(true);
    };

    const closeNoteModal = () => {
        setIsNoteModalOpen(false);
        setEditingNote(null);
    };

    const saveNote = async () => {
        if (!dealId || !editingNote) return;
        if (!editingNote.noteTitle || !editingNote.noteTitle.trim()) {
            alert("Please enter note title");
            return;
        }
        setNoteSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setNoteSaving(false);
                return;
            }

            const payload = {
                noteTitle: editingNote.noteTitle.trim(),
                noteType: editingNote.noteType ?? "PUBLIC",
                noteDetails: editingNote.noteDetails ?? "",
            };

            let res: Response;
            if (noteModalMode === "edit" && editingNote.id != null) {
                res = await fetch(`${BASE_URL}/deals/${dealId}/notes/${editingNote.id}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(`${BASE_URL}/deals/${dealId}/notes`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to save note: ${res.status} ${txt}`);
            }

            // refresh notes list
            await fetchNotes();
            closeNoteModal();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to save note");
        } finally {
            setNoteSaving(false);
        }
    };

    const deleteNote = async (noteId?: number) => {
        if (!dealId || noteId == null) return;
        if (!confirm("Are you sure you want to delete this note?")) return;
        setNoteDeletingId(noteId);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setNoteDeletingId(null);
                return;
            }

            const res = await fetch(`${BASE_URL}/deals/${dealId}/notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to delete note: ${res.status} ${txt}`);
            }

            // refresh notes
            await fetchNotes();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to delete note");
        } finally {
            setNoteDeletingId(null);
        }
    };

    // --- TAGS (handlers)
    const openAddTag = () => {
        setTagValue("");
        setIsAddTagOpen(true);
    };

    const closeAddTag = () => {
        setIsAddTagOpen(false);
        setTagValue("");
    };

    const saveTag = async () => {
        if (!dealId) return;
        if (!tagValue.trim()) {
            alert("Please enter a tag name");
            return;
        }
        setTagSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setTagSaving(false);
                return;
            }

            const payload = { tagName: tagValue.trim() };

            const res = await fetch(`${BASE_URL}/deals/${dealId}/tags`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to save tag: ${res.status} ${txt}`);
            }

            await fetchTags();
            closeAddTag();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to save tag");
        } finally {
            setTagSaving(false);
        }
    };

    const deleteTag = async (tagId?: number) => {
        if (!dealId || tagId == null) return;
        if (!confirm("Are you sure you want to delete this tag?")) return;
        setTagDeletingId(tagId);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setTagDeletingId(null);
                return;
            }

            const res = await fetch(`${BASE_URL}/deals/${dealId}/tags/${tagId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to delete tag: ${res.status} ${txt}`);
            }

            await fetchTags();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to delete tag");
        } finally {
            setTagDeletingId(null);
        }
    };

    // --- COMMENTS
    const openAddComment = () => {
        setCommentText("");
        setIsAddCommentOpen(true);
    };

    const closeAddComment = () => {
        setIsAddCommentOpen(false);
        setCommentText("");
    };

    const saveComment = async () => {
        if (!dealId) return;
        if (!commentText.trim()) {
            alert("Please enter a comment");
            return;
        }
        setCommentSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setCommentSaving(false);
                alert("No access token found");
                return;
            }

            const payload = { commentText: commentText.trim() };

            const res = await fetch(`${BASE_URL}/deals/${dealId}/comments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to save comment: ${res.status} ${txt}`);
            }

            if (onDealUpdated) {
                await onDealUpdated();
            }
            closeAddComment();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to save comment");
        } finally {
            setCommentSaving(false);
        }
    };

    const deleteComment = async (commentId?: number) => {
        if (!dealId || commentId == null) return;
        if (!confirm("Are you sure you want to delete this comment?")) return;
        setCommentDeletingId(commentId);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setCommentDeletingId(null);
                alert("No access token found");
                return;
            }

            const res = await fetch(
                `${BASE_URL}/deals/${dealId}/comments/${commentId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to delete comment: ${res.status} ${txt}`);
            }

            if (onDealUpdated) {
                await onDealUpdated();
            }
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to delete comment");
        } finally {
            setCommentDeletingId(null);
        }
    };

    // Small UI helpers
    const formatDate = (d?: string) => (d ? 
        // new Date(d).toLocaleDateString()
      format(  new Date(d), "dd-MM-yyyy")
         : "—");
    const formatTime = (t?: string) => (t ? t : "—");

    // People modal search filter
    const filteredAssigned = assignedEmployees.filter((a) =>
        (a.name || "").toLowerCase().includes(peopleSearch.toLowerCase())
    );

    // Document-level click-away: close any open action menu when clicking anywhere
    useEffect(() => {
        const handleDocClick = () => {
            setOpenActionMenu(null);
        };
        document.addEventListener("click", handleDocClick);
        return () => document.removeEventListener("click", handleDocClick);
    }, []);

    // helper to toggle menus safely and stop the document click from closing immediately
    const toggleActionMenu = (key: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent document click
        setOpenActionMenu((prev) => (prev === key ? null : key));
    };

    // used to stop close when clicking inside menu itself
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // open file picker (does not upload)
    const handleOpenFilePicker = () => {
        setSelectedFile(null);
        setSelectedFileName(null);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            setSelectedFile(f);
            setSelectedFileName(f.name);
        } else {
            setSelectedFile(null);
            setSelectedFileName(null);
        }
    };

    const uploadDocument = async () => {
        try {
            setUploading(true);
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                setUploading(false);
                return;
            }

            const fd = new FormData();
            let filename = UPLOADED_LOCAL_PATH.split("/").pop() || "upload.png";

            if (selectedFile) {
                fd.append("file", selectedFile);
                filename = selectedFile.name;
                fd.append("filename", filename);
                fd.append("url", selectedFile.name);
            } else {
                const placeholderContent = `LOCAL_PATH:${UPLOADED_LOCAL_PATH}`;
                const blob = new Blob([placeholderContent], { type: "text/plain" });
                const fileObj = new File([blob], filename, { type: "text/plain" });
                fd.append("file", fileObj);
                fd.append("filename", filename);
                fd.append("url", UPLOADED_LOCAL_PATH);
            }

            const res = await fetch(`${BASE_URL}/deals/${dealId}/documents`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: fd,
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to upload document: ${res.status} ${txt}`);
            }

            const json = await res.json();
            setDocuments((prev) => [json as DocumentItem, ...prev]);

            setSelectedFile(null);
            setSelectedFileName(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = async (docId: number) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                alert("No access token found");
                return;
            }

            const res = await fetch(
                `${BASE_URL}/deals/${dealId}/documents/${docId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to delete document: ${res.status} ${txt}`);
            }

            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Failed to delete document");
        }
    };

    return (
        <>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
                <div className="border-b -mx-4 px-4">
                    <nav className="flex gap-6 text-sm">
                        <button
                            onClick={() => setActiveTab("files")}
                            className={`py-3 px-1 ${activeTab === "files"
                                ? "border-b-2 border-violet-500 text-violet-600"
                                : "text-gray-600"
                                }`}
                        >
                            Files
                        </button>
                        <button
                            onClick={() => setActiveTab("followups")}
                            className={`py-3 px-1 ${activeTab === "followups"
                                ? "border-b-2 border-violet-500 text-violet-600"
                                : "text-gray-600"
                                }`}
                        >
                            Follow Up
                        </button>
                        <button
                            onClick={() => setActiveTab("people")}
                            className={`py-3 px-1 ${activeTab === "people"
                                ? "border-b-2 border-violet-500 text-violet-600"
                                : "text-gray-600"
                                }`}
                        >
                            People
                        </button>
                        <button
                            onClick={() => setActiveTab("notes")}
                            className={`py-3 px-1 ${activeTab === "notes"
                                ? "border-b-2 border-violet-500 text-violet-600"
                                : "text-gray-600"
                                }`}
                        >
                            Notes
                        </button>
                        <button
                            onClick={() => setActiveTab("comments")}
                            className={`py-3 px-1 ${activeTab === "comments"
                                ? "border-b-2 border-violet-500 text-violet-600"
                                : "text-gray-600"
                                }`}
                        >
                            Comments
                        </button>
                        <button
                            onClick={() => setActiveTab("tags")}
                            className={`py-3 px-1 ${activeTab === "tags"
                                ? "border-b-2 border-violet-500 text-violet-600"
                                : "text-gray-600"
                                }`}
                        >
                            Tags
                        </button>
                    </nav>
                </div>

                <div className="p-6 min-h-[180px]">
                    {/* FILES TAB */}
                    {activeTab === "files" && (
                        <div>
                            <div className="flex items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="*/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-violet-600 hover:bg-violet-50"
                                    onClick={handleOpenFilePicker}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            d="M12 4v12"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M8 8l4-4 4 4"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M20 20H4"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Choose File
                                </button>

                                <div className="text-sm text-gray-500">
                                    {selectedFileName ? (
                                        <span>Selected: {selectedFileName}</span>
                                    ) : (
                                        <span>
                                            No file selected (will use developer local file if you
                                            press Upload without selecting).
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={uploadDocument}
                                    disabled={uploading}
                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-white ${uploading
                                        ? "bg-gray-400"
                                        : "bg-violet-600 hover:bg-violet-700"
                                        }`}
                                >
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setSelectedFileName(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-gray-600 hover:bg-slate-50"
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="mt-6 text-sm text-gray-500">
                                {docsLoading && <div>Loading documents...</div>}
                                {docsError && (
                                    <div className="text-red-600">{docsError}</div>
                                )}
                                {!docsLoading && documents.length === 0 && (
                                    <div>No files uploaded yet.</div>
                                )}
                                <div className="space-y-3 mt-4">
                                    {documents.map((doc, idx) => (
                                        <div
                                            key={doc.id ?? `${doc.filename}-${idx}`}
                                            className="flex items-center justify-between p-3 border rounded-md"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center text-xs text-gray-400">
                                                    <img
                                                        src={doc.url || UPLOADED_LOCAL_PATH}
                                                        alt={doc.filename}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-medium">{doc.filename}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Uploaded:{" "}
                                                        {doc.uploadedAt
                                                            ? new Date(doc.uploadedAt).toLocaleString()
                                                            : "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={doc.url || UPLOADED_LOCAL_PATH}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-sky-600 hover:underline"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    onClick={() => deleteDocument(doc.id)}
                                                    className="text-sm text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOLLOWUPS TAB */}
                    {activeTab === "followups" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={openAddFollowup}
                                    className="inline-flex items-center gap-2 text-blue-600"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            d="M12 5v14"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M5 12h14"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Add a Follow Up 
                                </button>
                            </div>

                            <div className="rounded-md border overflow-hidden">
                                <div className="bg-blue-50 text-sm text-gray-700 grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-3 p-2 items-center font-medium">
                                    <div>Created</div>
                                    <div>Follow Up</div>
                                    <div>Remark</div>
                                    <div className="text-center">Status</div>
                                    <div className="text-center">Action</div>
                                </div>

                                <div>
                                    {followupsLoading && (
                                        <div className="p-4">Loading followups...</div>
                                    )}
                                    {followupsError && (
                                        <div className="p-4 text-red-600">{followupsError}</div>
                                    )}
                                    {!followupsLoading && followups.length === 0 && (
                                        <div className="p-4 text-sm text-gray-500">
                                            No follow ups
                                        </div>
                                    )}

                                    {followups.map((f, idx) => (
                                        <div
                                            key={f.id ?? `followup-${idx}`}
                                            className="grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-4 items-center p-4 border-t"
                                        >
                                            <div>{formatDate(f.nextDate)}</div>
                                            <div>{formatTime(f.startTime)}</div>
                                            <div>{f.remarks || "---"}</div>
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-block w-3 h-3 rounded-full ${f.status === "PENDING"
                                                            ? "bg-yellow-400"
                                                            : f.status === "CANCELLED"
                                                                ? "bg-gray-400"
                                                                : f.status === "COMPLETED"
                                                                    ? "bg-green-400"
                                                                    : "bg-gray-300"
                                                            }`}
                                                    />
                                                    <span className="text-sm">
                                                        {f.status ?? "PENDING"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) =>
                                                        toggleActionMenu(
                                                            `followup-${f.id ?? idx}`,
                                                            e
                                                        )
                                                    }
                                                    className="p-1 rounded hover:bg-slate-50 text-gray-500"
                                                    aria-label="Actions"
                                                >
                                                    ⋮
                                                </button>

                                                {openActionMenu === `followup-${f.id ?? idx}` && (
                                                    <div
                                                        onClick={stopPropagation}
                                                        className="absolute right-0 mt-2 w-36 bg-white border rounded-md shadow-sm z-50"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                openEditFollowup(f);
                                                                setOpenActionMenu(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                deleteFollowup(f.id);
                                                                setOpenActionMenu(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-slate-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PEOPLE TAB */}
                    {activeTab === "people" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={openAddPeopleModal}
                                    className="inline-flex items-center gap-2 text-blue-600"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            d="M12 5v14"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M5 12h14"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Add People
                                </button>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="search"
                                        placeholder="Search"
                                        value={peopleSearch}
                                        onChange={(e) => setPeopleSearch(e.target.value)}
                                        className="rounded-full border px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="rounded-md border overflow-hidden">
                                <div className="bg-blue-50 text-sm text-gray-700 grid grid-cols-[1fr_1fr_1fr_80px] gap-3 p-2 items-center font-medium">
                                    <div>Name</div>
                                    <div>Department</div>
                                    <div className="text-center">Designation</div>
                                    <div className="text-center">Action</div>
                                </div>

                                <div>
                                    {employeesLoading && (
                                        <div className="p-4">Loading people...</div>
                                    )}
                                    {employeesError && (
                                        <div className="p-4 text-red-600">
                                            {employeesError}
                                        </div>
                                    )}
                                    {!employeesLoading && assignedEmployees.length === 0 && (
                                        <div className="p-4 text-sm text-gray-500">
                                            No people assigned
                                        </div>
                                    )}

                                    {filteredAssigned.map((a, idx) => (
                                        <div
                                            key={a.employeeId ?? `emp-${idx}`}
                                            className="grid grid-cols-[1fr_1fr_1fr_80px] gap-4 items-center p-4 border-t"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                                                    {a.profileUrl ? (
                                                        <img
                                                            src={a.profileUrl}
                                                            alt={a.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                                            N
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{a.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {a.designation || ""}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        ID: {a.employeeId}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-sm">
                                                {a.department || "—"}
                                            </div>
                                            <div className="text-sm text-center">
                                                {a.designation || "—"}
                                            </div>

                                            <div className="text-center">
                                                <button
                                                    onClick={() => removeEmployee(a.employeeId)}
                                                    disabled={peopleDeletingId === a.employeeId}
                                                    className="text-red-600 hover:underline"
                                                    aria-label="Remove"
                                                >
                                                    {peopleDeletingId === a.employeeId
                                                        ? "Removing..."
                                                        : "🗑️"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTES TAB */}
                    {activeTab === "notes" && (
                        <div>
                            <div className="mb-4">
                                <button
                                    onClick={openAddNote}
                                    className="inline-flex items-center gap-2 text-blue-600"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <circle cx="12" cy="12" r="11" strokeWidth="1" />
                                        <path
                                            d="M12 8v8M8 12h8"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Add a Note
                                </button>
                            </div>

                            <div className="rounded-md border overflow-hidden">
                                <div className="bg-blue-50 text-sm text-gray-700 grid grid-cols-[1fr_1fr_80px] gap-3 p-3 items-center font-medium rounded-t-md">
                                    <div>Note Title</div>
                                    <div>Note Type</div>
                                    <div className="text-center">Action</div>
                                </div>

                                <div>
                                    {notesLoading && (
                                        <div className="p-6 text-sm text-gray-500">
                                            Loading notes...
                                        </div>
                                    )}
                                    {notesError && (
                                        <div className="p-6 text-sm text-red-600">
                                            {notesError}
                                        </div>
                                    )}

                                    {!notesLoading && notes.length === 0 && (
                                        <div className="p-6 text-sm text-gray-500">
                                            No notes yet.
                                        </div>
                                    )}

                                    {notes.map((n, idx) => (
                                        <div
                                            key={n.id ?? `note-${idx}`}
                                            className="grid grid-cols-[1fr_1fr_80px] items-start border-t p-4"
                                        >
                                            <div>
                                                <div className="font-medium text-sm">
                                                    {n.noteTitle}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {n.id} • {n.createdBy || "--"}
                                                </div>
                                            </div>
                                            <div className="text-sm">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">
                                                        {n.noteType === "PUBLIC"
                                                            ? "🌐 Public"
                                                            : "🔒 Private"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={(e) =>
                                                            toggleActionMenu(
                                                                `note-${n.id ?? idx}`,
                                                                e
                                                            )
                                                        }
                                                        className="p-1 rounded hover:bg-slate-50 text-gray-500"
                                                        aria-label="Actions"
                                                    >
                                                        ⋮
                                                    </button>

                                                    {openActionMenu === `note-${n.id ?? idx}` && (
                                                        <div
                                                            onClick={stopPropagation}
                                                            className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-sm z-50"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    openViewNote(n);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    openEditNote(n);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    deleteNote(n.id);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                disabled={noteDeletingId === n.id}
                                                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-slate-50"
                                                            >
                                                                {noteDeletingId === n.id
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMMENTS TAB */}
                    {activeTab === "comments" && (
                        <div>
                            <div className="mb-4">
                                <button
                                    onClick={openAddComment}
                                    className="inline-flex items-center gap-2 text-blue-600"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <circle cx="12" cy="12" r="11" strokeWidth="1" />
                                        <path
                                            d="M12 8v8M8 12h8"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Add a Comment
                                </button>
                            </div>

                            <div className="rounded-md border overflow-hidden">
                                <div className="bg-blue-50 text-sm text-gray-700 grid grid-cols-[140px_1fr_80px] gap-3 p-3 items-center font-medium rounded-t-md">
                                    <div>Date</div>
                                    <div>Comment</div>
                                    <div className="text-center">Action</div>
                                </div>

                                <div>
                                    {(!deal.comments || deal.comments.length === 0) && (
                                        <div className="p-6 text-sm text-gray-500">
                                            No comments yet.
                                        </div>
                                    )}

                                    {deal.comments &&
                                        deal.comments.length > 0 &&
                                        deal.comments.map((c: any, idx: number) => (
                                            <div
                                                key={
                                                    c.id ||
                                                    `${c.employeeId ?? "emp"}-${c.createdAt ?? idx
                                                    }`
                                                }
                                                className="grid grid-cols-[140px_1fr_80px] items-start border-t p-4"
                                            >
                                                <div className="text-sm text-gray-700">
                                                    {
                                                    format(new Date(
                                                        c.createdAt
                                                    ), "dd-MM-yyyy HH:mm")
                                                }
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    {c.commentText || "--"}
                                                </div>
                                                <div className="text-center">
                                                    <button
                                                        onClick={() => deleteComment(c.id)}
                                                        disabled={commentDeletingId === c.id}
                                                        className="text-red-600 hover:underline"
                                                        aria-label="Delete comment"
                                                    >
                                                        {commentDeletingId === c.id
                                                            ? "Deleting..."
                                                            : "🗑️"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAGS TAB */}
                    {activeTab === "tags" && (
                        <div>
                            <div className="mb-4">
                                <button
                                    onClick={openAddTag}
                                    className="inline-flex items-center gap-2 text-blue-600"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <circle cx="12" cy="12" r="11" strokeWidth="1" />
                                        <path
                                            d="M12 8v8M8 12h8"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Add a Tag
                                </button>
                            </div>

                            <div className="rounded-md border overflow-hidden">
                                <div className="bg-blue-50 text-sm text-gray-700 grid grid-cols-[1fr_80px] gap-3 p-3 items-center font-medium rounded-t-md">
                                    <div>Tag Name</div>
                                    <div className="text-center">Action</div>
                                </div>

                                <div>
                                    {tagsLoading && (
                                        <div className="p-6 text-sm text-gray-500">
                                            Loading tags...
                                        </div>
                                    )}
                                    {tagsError && (
                                        <div className="p-6 text-sm text-red-600">
                                            {tagsError}
                                        </div>
                                    )}

                                    {!tagsLoading && tags.length === 0 && (
                                        <div className="p-6 text-sm text-gray-500">
                                            No tags yet.
                                        </div>
                                    )}

                                    {tags.map((t, idx) => {
                                        const tagName =
                                            typeof t === "string" ? t : t.tagName;
                                        const tagId =
                                            typeof t === "string" ? undefined : t.id;
                                        const key = `${typeof t === "string" ? t : t.id ?? t.tagName
                                            }-${idx}`;
                                        return (
                                            <div
                                                key={key}
                                                className="grid grid-cols-[1fr_80px] items-center border-t p-4"
                                            >
                                                <div className="text-sm text-gray-700">
                                                    {tagName}
                                                </div>
                                                <div className="text-center">
                                                    <button
                                                        onClick={() => deleteTag(tagId)}
                                                        disabled={tagDeletingId === tagId}
                                                        className="text-red-600"
                                                        aria-label="Delete tag"
                                                    >
                                                        {tagDeletingId === tagId
                                                            ? "Deleting..."
                                                            : "🗑️"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Followup Modal */}
            {isFollowupModalOpen && editingFollowup && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={closeFollowupModal}
                    />
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl border p-6 mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">
                                {editingFollowup.id ? "Edit Follow Up" : "Add Follow Up"}
                            </h3>
                            <button
                                onClick={closeFollowupModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="rounded-lg border p-6 mb-6">
                            <div className="text-sm font-medium mb-4">
                                Follow Up Details
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm text-gray-600">
                                        Next Follow Up *
                                    </label>
                                    <input
                                        type="date"
                                        value={editingFollowup.nextDate}
                                        onChange={(e) =>
                                            setEditingFollowup({
                                                ...editingFollowup,
                                                nextDate: e.target.value,
                                            })
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">
                                        Start Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={editingFollowup.startTime}
                                        onChange={(e) =>
                                            setEditingFollowup({
                                                ...editingFollowup,
                                                startTime: e.target.value,
                                            })
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">
                                        Status
                                    </label>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${editingFollowup.status === "PENDING"
                                                ? "bg-yellow-50 border-yellow-200"
                                                : editingFollowup.status === "COMPLETED"
                                                    ? "bg-green-50 border-green-200"
                                                    : editingFollowup.status === "CANCELLED"
                                                        ? "bg-gray-50 border-gray-200"
                                                        : "bg-white"
                                                }`}
                                        >
                                            <span
                                                className={`inline-block w-2 h-2 rounded-full ${editingFollowup.status === "PENDING"
                                                    ? "bg-yellow-400"
                                                    : editingFollowup.status === "COMPLETED"
                                                        ? "bg-green-400"
                                                        : editingFollowup.status === "CANCELLED"
                                                            ? "bg-gray-400"
                                                            : "bg-gray-300"
                                                    }`}
                                            />
                                            <span className="text-sm">
                                                {editingFollowup.status ?? "PENDING"}
                                            </span>
                                        </span>

                                        <select
                                            value={editingFollowup.status}
                                            onChange={(e) =>
                                                setEditingFollowup({
                                                    ...editingFollowup,
                                                    status: e.target.value as any,
                                                })
                                            }
                                            className="mt-0 block rounded-md border px-3 py-2"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        id="sendReminder"
                                        type="checkbox"
                                        checked={!!editingFollowup.sendReminder}
                                        onChange={(e) =>
                                            setEditingFollowup({
                                                ...editingFollowup,
                                                sendReminder: e.target.checked,
                                            })
                                        }
                                    />
                                    <label
                                        htmlFor="sendReminder"
                                        className="text-sm text-gray-700"
                                    >
                                        Send Reminder
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600">
                                        Remind Before *
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={editingFollowup.remindBefore ?? 1}
                                        onChange={(e) =>
                                            setEditingFollowup({
                                                ...editingFollowup,
                                                remindBefore: Number(e.target.value),
                                            })
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600">
                                        Days / Hours / Minutes
                                    </label>
                                    <select
                                        value={editingFollowup.remindUnit}
                                        onChange={(e) =>
                                            setEditingFollowup({
                                                ...editingFollowup,
                                                remindUnit: e.target.value,
                                            })
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2"
                                    >
                                        <option value="DAYS">Days</option>
                                        <option value="HOURS">Hours</option>
                                        <option value="MINUTES">Minutes</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-600">
                                        Remark
                                    </label>
                                    <textarea
                                        value={editingFollowup.remarks}
                                        onChange={(e) =>
                                            setEditingFollowup({
                                                ...editingFollowup,
                                                remarks: e.target.value,
                                            })
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2 min-h-[120px]"
                                        placeholder="---"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-center gap-6">
                            <button
                                onClick={closeFollowupModal}
                                className="px-6 py-2 border rounded-md text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveFollowup}
                                disabled={followupSaving}
                                className={`px-6 py-2 rounded-md text-sm text-white ${followupSaving
                                    ? "bg-gray-400"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {followupSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add People Modal */}
            {isAddPeopleOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={closeAddPeopleModal}
                    />
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl border p-6 mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Add People</h3>
                            <button
                                onClick={closeAddPeopleModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="rounded-lg border p-6 mb-6">
                            <div className="text-sm font-medium mb-4">Add People</div>

                            <div className="grid grid-cols-2 gap-6 items-end">
                                <div>
                                    <label className="text-sm text-gray-600">Name *</label>
                                    <select
                                        value={selectedAddEmployeeId ?? ""}
                                        onChange={(e) =>
                                            setSelectedAddEmployeeId(e.target.value)
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2"
                                    >
                                        <option value="">-- Select Person --</option>
                                        {availableToAdd.map((p) => (
                                            <option key={p.employeeId} value={p.employeeId}>
                                                {p.name}{" "}
                                                {p.department ? `— ${p.department}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">
                                        Department *
                                    </label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) =>
                                            setSelectedDepartment(e.target.value)
                                        }
                                        className="mt-2 block w-full rounded-md border px-3 py-2"
                                    >
                                        <option value="">-- All Departments --</option>
                                        {departments.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 text-sm text-gray-500">
                                    <div className="mt-2">
                                        Tip: Choose department to filter the Name dropdown.
                                        If Department is left as <strong>All</strong>, all
                                        available employees will show.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-6">
                            <button
                                onClick={closeAddPeopleModal}
                                className="px-6 py-2 border rounded-md text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addEmployee}
                                disabled={peopleSaving || !selectedAddEmployeeId}
                                className={`px-6 py-2 rounded-md text-sm text-white ${peopleSaving
                                    ? "bg-gray-400"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {peopleSaving ? "Adding..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {isNoteModalOpen && editingNote && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={closeNoteModal}
                    />
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl border p-6 mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">
                                {noteModalMode === "add"
                                    ? "Add Deal Note"
                                    : noteModalMode === "edit"
                                        ? "Edit Deal Note"
                                        : editingNote.noteTitle || "View Note"}
                            </h3>
                            <button
                                onClick={closeNoteModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {noteModalMode === "view" ? (
                            <div className="rounded-lg border p-6 mb-6">
                                <div className="text-sm font-medium mb-4">
                                    Deal Note Details
                                </div>

                                <div className="grid grid-cols-[220px_1fr] gap-4 text-sm text-gray-700">
                                    <div className="text-gray-500">Note Title</div>
                                    <div className="text-gray-900">
                                        {editingNote.noteTitle || "—"}
                                    </div>

                                    <div className="text-gray-500">Note Type</div>
                                    <div className="text-gray-900">
                                        {editingNote.noteType === "PUBLIC"
                                            ? "Public"
                                            : "Private"}
                                    </div>

                                    <div className="text-gray-500">Note Detail</div>
                                    <div className="text-gray-900">
                                        {editingNote.noteDetails &&
                                            editingNote.noteDetails.trim()
                                            ? editingNote.noteDetails
                                            : "---"}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-6 mb-6">
                                <div className="text-sm font-medium mb-4">
                                    Deal Note Details
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm text-gray-600">
                                            Note Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={editingNote.noteTitle}
                                            onChange={(e) =>
                                                setEditingNote({
                                                    ...editingNote,
                                                    noteTitle: e.target.value,
                                                })
                                            }
                                            className="mt-2 block w-full rounded-md border px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">
                                            Note Type
                                        </label>
                                        <div className="mt-2 flex items-center gap-4">
                                            <label className="inline-flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="noteType"
                                                    value="PUBLIC"
                                                    checked={editingNote.noteType === "PUBLIC"}
                                                    onChange={() =>
                                                        setEditingNote({
                                                            ...editingNote,
                                                            noteType: "PUBLIC",
                                                        })
                                                    }
                                                />
                                                <span className="text-sm">Public</span>
                                            </label>

                                            <label className="inline-flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="noteType"
                                                    value="PRIVATE"
                                                    checked={editingNote.noteType === "PRIVATE"}
                                                    onChange={() =>
                                                        setEditingNote({
                                                            ...editingNote,
                                                            noteType: "PRIVATE",
                                                        })
                                                    }
                                                />
                                                <span className="text-sm">Private</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm text-gray-600">
                                            Note Detail
                                        </label>
                                        <textarea
                                            value={editingNote.noteDetails}
                                            onChange={(e) =>
                                                setEditingNote({
                                                    ...editingNote,
                                                    noteDetails: e.target.value,
                                                })
                                            }
                                            className="mt-2 block w-full rounded-md border px-3 py-2 min-h-[120px]"
                                            placeholder="--"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex justify-center gap-6">
                            <button
                                onClick={closeNoteModal}
                                className="px-6 py-2 border rounded-md text-sm"
                            >
                                Cancel
                            </button>

                            {noteModalMode !== "view" && (
                                <button
                                    onClick={saveNote}
                                    disabled={noteSaving}
                                    className={`px-6 py-2 rounded-md text-sm text-white ${noteSaving
                                        ? "bg-gray-400"
                                        : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {noteSaving ? "Saving..." : "Save"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Tag Modal */}
            {isAddTagOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={closeAddTag}
                    />
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl border p-6 mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Add Tags</h3>
                            <button
                                onClick={closeAddTag}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="rounded-lg border p-6 mb-6">
                            <div className="text-sm font-medium mb-4">Tag</div>

                            <div>
                                <label className="text-sm text-gray-600">Tag *</label>
                                <input
                                    type="text"
                                    value={tagValue}
                                    onChange={(e) => setTagValue(e.target.value)}
                                    className="mt-2 block w-full rounded-md border px-3 py-2"
                                    placeholder="--"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center gap-6">
                            <button
                                onClick={closeAddTag}
                                className="px-6 py-2 border rounded-md text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTag}
                                disabled={tagSaving}
                                className={`px-6 py-2 rounded-md text-sm text-white ${tagSaving
                                    ? "bg-gray-400"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {tagSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Comment Modal */}
            {isAddCommentOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={closeAddComment}
                    />
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl border p-6 mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Add a Comment</h3>
                            <button
                                onClick={closeAddComment}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="rounded-lg border p-6 mb-6">
                            <div className="text-sm font-medium mb-4">Comment</div>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="--"
                                className="mt-2 block w-full rounded-md border px-3 py-2 min-h-[120px]"
                            />
                        </div>

                        <div className="mt-4 flex justify-center gap-6">
                            <button
                                onClick={closeAddComment}
                                className="px-6 py-2 border rounded-md text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveComment}
                                disabled={commentSaving}
                                className={`px-6 py-2 rounded-md text-sm text-white ${commentSaving
                                    ? "bg-gray-400"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {commentSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
