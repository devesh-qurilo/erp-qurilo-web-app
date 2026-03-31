// components/TaskViewModal.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

type Employee = { employeeId: string; name: string; profileUrl?: string | null; role?: string };
type Label = { id: number; name: string };
type Milestone = { id: number; title: string };

export type TaskForView = {
  id: number;
  title?: string;
  projectId?: number;
  projectName?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdOn?: string | null;
  noDueDate?: boolean;
  assignedEmployees?: Employee[] | null;
  assignedEmployeeIds?: string[];
  description?: string | null;
  labels?: Label[];
  milestone?: Milestone | null;
  milestoneId?: number | null;
  priority?: string | null;
  isPrivate?: boolean;
  timeEstimateMinutes?: number | null;
  isDependent?: boolean;
  attachments?: { name?: string; url?: string }[] | null;
  taskStage?: { id?: number; name?: string } | null;
  hoursLoggedMinutes?: number | null;
  // optional: subtasks could be added later
};

type Note = {
  id: number;
  title: string;
  type: "public" | "private";
  content?: string;
};

type TimesheetRow = {
  id: number;
  employee: Employee;
  startTime: string; // ISO or date string
  endTime: string;
  memo?: string;
  minutesLogged: number;
};

export default function TaskViewModal({
  open,
  task,
  onClose,
  onMarkComplete,
}: {
  open: boolean;
  task: TaskForView | null;
  onClose: () => void;
  onMarkComplete?: (taskId: number) => void;
}) {
  // ---------- hooks (all at top; never conditional) ----------
  const [tab, setTab] = useState<"files" | "subtask" | "timesheet" | "notes">(
    "files"
  );
  const [isVisible, setIsVisible] = useState(false);

  // left card menu (3-dot at top-right of big left card)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  // reminder confirmation modal
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false);
  const reminderModalRef = useRef<HTMLDivElement | null>(null);

  // file upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subtask UI state (for placeholder UI)
  const [subtaskDone, setSubtaskDone] = useState(false);
  const [subtaskMenuOpen, setSubtaskMenuOpen] = useState(false);
  const subtaskMenuRef = useRef<HTMLDivElement | null>(null);
  const subtaskMenuBtnRef = useRef<HTMLButtonElement | null>(null);

  // Add Subtask modal state + form fields
  const [addSubtaskOpen, setAddSubtaskOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDesc, setNewSubtaskDesc] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  // View / Edit subtask modal states
  const [viewSubtaskOpen, setViewSubtaskOpen] = useState(false);
  const [editSubtaskOpen, setEditSubtaskOpen] = useState(false);

  // edit form fields (prefilled when edit opens)
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editSubtaskDesc, setEditSubtaskDesc] = useState("");
  const [editTitleError, setEditTitleError] = useState<string | null>(null);

  // Notes data + UI state
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: "My Note", type: "public", content: "This is the body of My Note." },
  ]);
  const [openNoteMenuId, setOpenNoteMenuId] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [viewNoteOpen, setViewNoteOpen] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [deleteNoteConfirmOpen, setDeleteNoteConfirmOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [addNoteTitle, setAddNoteTitle] = useState("");
  const [addNoteType, setAddNoteType] = useState<"public" | "private">("public");
  const [addNoteContent, setAddNoteContent] = useState("");
  const [addNoteTitleError, setAddNoteTitleError] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteType, setEditNoteType] = useState<"public" | "private">("public");
  const [editNoteContent, setEditNoteContent] = useState("");

  // Edit Task modal state + fields (NEW: full UI per screenshot)
  const [editTaskOpen, setEditTaskOpen] = useState(false);

  // Task Information fields
  const [etTitle, setEtTitle] = useState("");
  const [etTaskCategory, setEtTaskCategory] = useState("");
  const [etProject, setEtProject] = useState(""); // project id/name string for select
  const [etStartDate, setEtStartDate] = useState<string | null>(null);
  const [etDueDate, setEtDueDate] = useState<string | null>(null);
  const [etWithoutDueDate, setEtWithoutDueDate] = useState(false);
  const [etStatus, setEtStatus] = useState<string>("Doing");
  const [etAssignedTo, setEtAssignedTo] = useState<string>(""); // assigned employee id or name
  const [etDescription, setEtDescription] = useState("");

  // Other Details
  const [etLabel, setEtLabel] = useState("");
  const [etMilestone, setEtMilestone] = useState("");
  const [etPriority, setEtPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Low");
  const [etMakePrivate, setEtMakePrivate] = useState(false);
  const [etTimeEstimateChecked, setEtTimeEstimateChecked] = useState(false);
  const [etTimeEstimateMins, setEtTimeEstimateMins] = useState<number | "">("");
  const [etDependentChecked, setEtDependentChecked] = useState(false);
  const [etDependentTask, setEtDependentTask] = useState("");
  const [etFile, setEtFile] = useState<File | null>(null);

  const [editTaskErrors, setEditTaskErrors] = useState<string | null>(null);

  // Timesheet placeholder data (to match the provided UI)
  const [timesheets] = useState<TimesheetRow[]>([
    {
      id: 1,
      employee: { employeeId: "u1", name: "Jack Smith", profileUrl: undefined, role: "Trainee" },
      startTime: "2025-08-02T11:00:00",
      endTime: "2025-08-02T13:00:00",
      memo: "---",
      minutesLogged: 8 * 60,
    },
    {
      id: 2,
      employee: { employeeId: "u1", name: "Jack Smith", profileUrl: undefined, role: "Trainee" },
      startTime: "2025-08-02T11:00:00",
      endTime: "2025-08-02T13:00:00",
      memo: "---",
      minutesLogged: 8 * 60,
    },
    {
      id: 3,
      employee: { employeeId: "u1", name: "Jack Smith", profileUrl: undefined, role: "Trainee" },
      startTime: "2025-08-02T11:00:00",
      endTime: "2025-08-02T13:00:00",
      memo: "---",
      minutesLogged: 8 * 60,
    },
    {
      id: 4,
      employee: { employeeId: "u1", name: "Jack Smith", profileUrl: undefined, role: "Trainee" },
      startTime: "2025-08-02T11:00:00",
      endTime: "2025-08-02T13:00:00",
      memo: "---",
      minutesLogged: 8 * 60,
    },
  ]);

  useEffect(() => {
    if (open) setIsVisible(true);
    else {
      setIsVisible(false);
      setMenuOpen(false);
      setReminderConfirmOpen(false);
      setSubtaskMenuOpen(false);
      setAddSubtaskOpen(false);
      setViewSubtaskOpen(false);
      setEditSubtaskOpen(false);
      setOpenNoteMenuId(null);
      setViewNoteOpen(false);
      setEditNoteOpen(false);
      setDeleteNoteConfirmOpen(false);
      setCurrentNote(null);
      setAddNoteOpen(false);
      setEditTaskOpen(false);
    }
  }, [open]);

  // close menus / modals on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // left-card menu
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }

      // subtask row menu
      if (
        subtaskMenuOpen &&
        subtaskMenuRef.current &&
        !subtaskMenuRef.current.contains(e.target as Node) &&
        subtaskMenuBtnRef.current &&
        !subtaskMenuBtnRef.current.contains(e.target as Node)
      ) {
        setSubtaskMenuOpen(false);
      }

      // reminder modal
      if (
        reminderConfirmOpen &&
        reminderModalRef.current &&
        !reminderModalRef.current.contains(e.target as Node)
      ) {
        setReminderConfirmOpen(false);
      }

      // notes actions popup: click outside of popup/button should close it
      if (openNoteMenuId !== null) {
        const insideMenu = (e.target as Element).closest("[data-notes-menu]");
        const onBtn = (e.target as Element).closest("[data-notes-menu-btn]");
        if (!insideMenu && !onBtn) {
          setOpenNoteMenuId(null);
        }
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSubtaskMenuOpen(false);
        setReminderConfirmOpen(false);
        setAddSubtaskOpen(false);
        setViewSubtaskOpen(false);
        setEditSubtaskOpen(false);
        setOpenNoteMenuId(null);
        setViewNoteOpen(false);
        setEditNoteOpen(false);
        setDeleteNoteConfirmOpen(false);
        setAddNoteOpen(false);
        setEditTaskOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, subtaskMenuOpen, reminderConfirmOpen, openNoteMenuId, addNoteOpen]);

  const priorityDot = useMemo(() => {
    const priority = (task?.priority || "").toLowerCase();
    switch (priority) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-400";
      case "high":
        return "bg-orange-500";
      case "urgent":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  }, [task?.priority]);
  // ---------- end hooks ----------

  if (!open || !task) return null;

  const fmtDate = (d?: string | null) => (d ?
    // new Date(d).toLocaleDateString()
    format(new Date(d), "dd-MM-yyyy")
    : "--");
  const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString() : "--");
  const fmtShortDate = (d?: string | null) => {
    if (!d) return "--";
    const dt = new Date(d);
    // format DD/MM/YYYY (as in screenshot)
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const fmtTime = (d?: string | null) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--");
  const minsToHuman = (mins?: number | null) => {
    if (mins === null || mins === undefined) return "--";
    const h = Math.floor((mins || 0) / 60);
    const m = (mins || 0) % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  // Placeholder actions (kept same behavior as before)
  const sendReminderAction = () => {
    alert("Reminder sent to assigned employees");
  };
  const handleSendReminderMenu = () => {
    setMenuOpen(false);
    setReminderConfirmOpen(true);
  };

  // --- UPDATED: open Edit Task modal instead of alert; prefill fields ---
  const handleEditTask = () => {
    setMenuOpen(false);

    // Prefill UI fields using `task`
    setEtTitle(task.title ?? "");
    setEtTaskCategory(""); // not available on task object in shape provided
    setEtProject(task.projectName ?? "");
    setEtStartDate(task.startDate ?? null);
    setEtDueDate(task.dueDate ?? null);
    setEtWithoutDueDate(Boolean(task.noDueDate));
    setEtStatus(task.taskStage?.name ?? "Doing");
    setEtAssignedTo(
      (task.assignedEmployees && task.assignedEmployees.length && task.assignedEmployees[0].name) ??
      (task.assignedEmployeeIds && task.assignedEmployeeIds[0]) ??
      ""
    );
    setEtDescription(task.description ?? "");
    setEtLabel((task.labels && task.labels[0]?.name) ?? "");
    setEtMilestone(task.milestone?.title ?? "");
    setEtPriority((task.priority ? (String(task.priority).charAt(0).toUpperCase() + String(task.priority).slice(1)) : "Low") as
      | "Low"
      | "Medium"
      | "High"
      | "Urgent");
    setEtMakePrivate(Boolean(task.isPrivate));
    setEtTimeEstimateChecked(Boolean(task.timeEstimateMinutes));
    setEtTimeEstimateMins(task.timeEstimateMinutes ?? "");
    setEtDependentChecked(Boolean(task.isDependent));
    setEtDependentTask("");
    setEtFile(null);
    setEditTaskErrors(null);

    setEditTaskOpen(true);
  };

  const handlePinTask = () => {
    setMenuOpen(false);
    alert("Pin Task clicked");
  };
  const handleCopyTaskLink = () => {
    setMenuOpen(false);
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/tasks/${task.id}`;
    try {
      navigator.clipboard?.writeText(link);
      alert("Task link copied to clipboard");
    } catch {
      alert("Task link: " + link);
    }
  };
  const handleConfirmYes = () => {
    sendReminderAction();
    setReminderConfirmOpen(false);
  };
  const handleConfirmCancel = () => {
    setReminderConfirmOpen(false);
  };

  // file upload UI (UI-only)
  const onUploadClick = () => fileInputRef.current?.click();
  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    alert(
      `${files.length} file(s) selected. Integrate your upload handler to actually send files to server.`
    );
    e.currentTarget.value = "";
  };

  // Subtask UI handlers (minimal; keep functionality same otherwise)
  const onToggleSubtaskDone = () => {
    setSubtaskDone((s) => !s);
  };

  // Subtask menu actions: View, Edit, Delete (UI-only)
  const onSubtaskView = () => {
    setSubtaskMenuOpen(false);
    setViewSubtaskOpen(true);
  };
  const onSubtaskEdit = () => {
    setSubtaskMenuOpen(false);
    setEditSubtaskTitle("Title of the sub task");
    setEditSubtaskDesc("");
    setEditTitleError(null);
    setEditSubtaskOpen(true);
  };
  const onSubtaskDelete = () => {
    setSubtaskMenuOpen(false);
    if (confirm("Delete subtask? This is UI-only.")) {
      alert("Subtask deleted (UI-only). Integrate API to persist.");
    }
  };

  // Add Subtask form handlers
  const openAddSubtask = () => {
    setNewSubtaskTitle("");
    setNewSubtaskDesc("");
    setTitleError(null);
    setAddSubtaskOpen(true);
  };
  const onCancelAddSubtask = () => {
    setAddSubtaskOpen(false);
    setTitleError(null);
  };
  const onSaveAddSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      setTitleError("Title is required");
      return;
    }
    alert(`Subtask "${newSubtaskTitle}" created (UI-only). Integrate API to persist.`);
    setAddSubtaskOpen(false);
  };

  // Edit Subtask handlers (Update button)
  const onCancelEditSubtask = () => {
    setEditSubtaskOpen(false);
    setEditTitleError(null);
  };
  const onUpdateSubtask = () => {
    if (!editSubtaskTitle.trim()) {
      setEditTitleError("Title is required");
      return;
    }
    alert(`Subtask updated to "${editSubtaskTitle}" (UI-only). Integrate API to persist.`);
    setEditSubtaskOpen(false);
  };

  // helper: derive friendly filename (kept from earlier)
  const friendlyNameFromUrl = (url?: string) => {
    if (!url) return "attachment";
    try {
      const last = url.split("/").pop() || url;
      return decodeURIComponent(last.split("?")[0]);
    } catch {
      return url;
    }
  };

  // ----- Notes handlers (UI-only) -----
  const onOpenNoteMenu = (note: Note) => {
    setCurrentNote(note);
    setOpenNoteMenuId(note.id);
  };

  const onViewNote = () => {
    if (!currentNote) return;
    setViewNoteOpen(true);
    setOpenNoteMenuId(null);
  };

  const onEditNote = () => {
    if (!currentNote) return;
    setEditNoteTitle(currentNote.title);
    setEditNoteType(currentNote.type);
    setEditNoteContent(currentNote.content ?? "");
    setEditNoteOpen(true);
    setOpenNoteMenuId(null);
  };

  const onDeleteNote = () => {
    if (!currentNote) return;
    setDeleteNoteConfirmOpen(true);
    setOpenNoteMenuId(null);
  };

  const confirmDeleteNote = () => {
    if (!currentNote) {
      setDeleteNoteConfirmOpen(false);
      return;
    }
    setNotes((n) => n.filter((x) => x.id !== currentNote.id));
    setDeleteNoteConfirmOpen(false);
    setCurrentNote(null);
  };

  const cancelDeleteNote = () => {
    setDeleteNoteConfirmOpen(false);
    setCurrentNote(null);
  };

  const saveNoteEdit = () => {
    if (!currentNote) return;
    if (!editNoteTitle.trim()) {
      alert("Title is required");
      return;
    }
    setNotes((n) =>
      n.map((x) =>
        x.id === currentNote.id
          ? { ...x, title: editNoteTitle.trim(), type: editNoteType, content: editNoteContent }
          : x
      )
    );
    setEditNoteOpen(false);
    setCurrentNote(null);
  };

  const closeViewNote = () => {
    setViewNoteOpen(false);
    setCurrentNote(null);
  };

  // Add Note handlers
  const openAddNote = () => {
    setAddNoteTitle("");
    setAddNoteContent("");
    setAddNoteType("public");
    setAddNoteTitleError(null);
    setAddNoteOpen(true);
  };

  const cancelAddNote = () => {
    setAddNoteOpen(false);
    setAddNoteTitleError(null);
  };

  const saveAddNote = () => {
    if (!addNoteTitle.trim()) {
      setAddNoteTitleError("Title is required");
      return;
    }
    const newId = notes.length ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
    const newNote: Note = {
      id: newId,
      title: addNoteTitle.trim(),
      type: addNoteType,
      content: addNoteContent,
    };
    setNotes((n) => [newNote, ...n]);
    setAddNoteOpen(false);
    setAddNoteTitle("");
    setAddNoteContent("");
    setAddNoteType("public");
  };

  // ----- end Notes handlers -----

  // ----- Edit Task modal handlers (NEW UI) -----
  const onAddCategoryClick = () => {
    alert("Add Task Category clicked (UI-only).");
  };

  const onAddLabelClick = () => {
    alert("Add Label clicked (UI-only).");
  };

  const onFileDrop = (f: File | null) => {
    setEtFile(f);
  };

  const onCancelEditTask = () => {
    setEditTaskOpen(false);
    setEditTaskErrors(null);
  };

  const onUpdateTask = () => {
    // basic validations
    if (!etTitle.trim()) {
      setEditTaskErrors("Title is required");
      return;
    }
    if (etDependentChecked && !etDependentTask.trim()) {
      setEditTaskErrors("Dependent Task is required when dependency is checked");
      return;
    }

    // build payload (UI-only)
    const payload = {
      id: task.id,
      title: etTitle.trim(),
      category: etTaskCategory.trim(),
      project: etProject,
      startDate: etStartDate,
      dueDate: etWithoutDueDate ? null : etDueDate,
      withoutDueDate: etWithoutDueDate,
      status: etStatus,
      assignedTo: etAssignedTo,
      description: etDescription.trim(),
      label: etLabel,
      milestone: etMilestone,
      priority: etPriority,
      isPrivate: etMakePrivate,
      timeEstimateMins: etTimeEstimateChecked ? Number(etTimeEstimateMins || 0) : null,
      isDependent: etDependentChecked,
      dependentTask: etDependentTask,
      fileName: etFile ? etFile.name : null,
    };

    alert("Update (UI-only) payload:\n" + JSON.stringify(payload, null, 2));
    setEditTaskOpen(false);
  };

  const onChooseFileClick = () => {
    // open native file dialog (hidden input)
    fileInputRef.current?.click();
  };

  const onHiddenFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setEtFile(f);
    }
    // clear input so same file can be picked again if needed
    e.currentTarget.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/0">
      <div
        className={[
          "relative h-full w-[83vw] max-w-[83vw] bg-white shadow-xl border-l",
          "transform transition-transform duration-300",
          isVisible ? "translate-x-0" : "translate-x-full",
          "flex flex-col",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="text-sm text-gray-500">
              Task #
              {task.projectId ? `RTA-${String(task.id).padStart(2, "0")}` : `RTA-${String(task.id)}`}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="text-lg font-semibold">{task.title ?? "Task Name"}</div>
            </div>
          </div>

          {/* Close */}
          <button aria-label="close" onClick={onClose} className="p-2 rounded hover:bg-gray-100" title="Close">
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left big card */}
            <div className="lg:col-span-2 bg-white border rounded-lg p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <button
                    onClick={() => task.id && onMarkComplete?.(task.id)}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 text-sm"
                  >
                    Mark As Complete
                  </button>
                </div>

                <div className="flex items-center gap-2 relative">
                  {/* 3-dot menu */}
                  <button ref={menuBtnRef} onClick={() => setMenuOpen((s) => !s)} className="p-2 rounded hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor">
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div ref={menuRef} className="absolute right-10 top-10 w-48 bg-white border rounded-lg shadow-md p-2 z-50">
                      <button onClick={handleSendReminderMenu} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        🔔 Send Reminder
                      </button>
                      <button onClick={handleEditTask} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        ✏️ Edit Task
                      </button>
                      <button onClick={handlePinTask} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        📌 Pin Task
                      </button>
                      <button onClick={handleCopyTaskLink} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        🔗 Copy Task Link
                      </button>
                    </div>
                  )}

                  {/* placeholder to preserve layout */}
                  <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 text-sm">
                <div className="text-gray-500">Project</div>
                <div className="font-medium">{task.projectName ?? `Project ${task.projectId ?? "--"}`}</div>

                <div className="text-gray-500">Priority</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${priorityDot}`} />
                  <span className="font-medium">{task.priority ?? "Low"}</span>
                </div>

                <div className="text-gray-500">Assigned to</div>
                <div className="font-medium">
                  {task.assignedEmployees && task.assignedEmployees.length
                    ? task.assignedEmployees.map((a) => a.name).join(", ")
                    : task.assignedEmployeeIds && task.assignedEmployeeIds.length
                      ? task.assignedEmployeeIds.join(", ")
                      : "--"}
                </div>

                <div className="text-gray-500">Project Code</div>
                <div className="font-medium">RTA-{String(task.id).padStart(2, "0")}</div>

                <div className="text-gray-500">Milestones</div>
                <div className="font-medium">{task.milestone?.title ?? "----"}</div>

                <div className="text-gray-500">Label</div>
                <div className="font-medium">{task.labels && task.labels.length ? task.labels.map((l) => l.name).join(", ") : "--"}</div>

                <div className="text-gray-500">Task Category</div>
                <div className="font-medium">--</div>

                <div className="text-gray-500">Description</div>
                <div className="font-medium whitespace-pre-wrap">{task.description ?? "--"}</div>
              </div>
            </div>

            {/* Right small card */}
            <div className="bg-white border rounded-lg p-5">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="font-medium">{task.taskStage?.name ?? "Doing"}</div>
              </div>

              <div className="mt-4 text-sm">
                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Created On</div>
                  <div className="font-medium">{fmtDateTime(task.createdOn)}</div>
                </div>

                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Start Date</div>
                  <div className="font-medium">{fmtDate(task.startDate)}</div>
                </div>

                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Due Date</div>
                  <div className="font-medium">{task.noDueDate ? "--" : fmtDate(task.dueDate)}</div>
                </div>

                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Hours Logged</div>
                  <div className="font-medium">{minsToHuman(task.hoursLoggedMinutes ?? null)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs area */}
          <div className="px-6 pb-6">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setTab("files")}
                    className={`pb-2 ${tab === "files" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setTab("subtask")}
                    className={`pb-2 ${tab === "subtask" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Sub Task
                  </button>
                  <button
                    onClick={() => setTab("timesheet")}
                    className={`pb-2 ${tab === "timesheet" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Timesheet
                  </button>
                  <button
                    onClick={() => setTab("notes")}
                    className={`pb-2 ${tab === "notes" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Notes
                  </button>
                </div>

                {/* Removed right upload button (kept blank to match UI) */}
                <div />
              </div>

              {/* Content area */}
              <div className="mt-4 border rounded-lg p-4 bg-white h-60 overflow-auto">
                {/* Hidden file input (for Files tab) */}
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked} multiple />

                {/* ----- FILES TAB ----- */}
                {tab === "files" && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onUploadClick}
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                        aria-label="Upload File"
                        title="Upload File"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-600 text-blue-600 text-xs">+</span>
                        <span>Upload File</span>
                      </button>
                    </div>

                    <div className="mt-3 flex-1 overflow-auto">
                      {task.attachments && task.attachments.length ? (
                        <ul className="space-y-2 text-sm">
                          {task.attachments.map((a, i) => {
                            const displayName = a.name ?? friendlyNameFromUrl(a.url);
                            return (
                              <li key={i} className="flex items-center justify-between">
                                <div className="truncate max-w-[80%]">{displayName}</div>
                                <div className="text-xs text-gray-500">
                                  {a.url ? (
                                    <a href={a.url} target="_blank" rel="noreferrer" className="underline">
                                      Download
                                    </a>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-gray-500">{/* intentionally minimal empty state */}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ----- SUBTASK TAB ----- */}
                {tab === "subtask" && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openAddSubtask}
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                        aria-label="Add a Sub Task"
                        title="Add a Sub Task"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-600 text-blue-600 text-xs">+</span>
                        <span>Add a Sub Task</span>
                      </button>
                    </div>

                    <div className="mt-4 flex-1 overflow-auto">
                      <ul className="space-y-3">
                        <li className="flex items-center justify-between pr-2">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={subtaskDone}
                                onChange={onToggleSubtaskDone}
                                className="w-4 h-4 rounded border-gray-300"
                                aria-label="toggle subtask done"
                              />
                              <span className={`text-sm ${subtaskDone ? "line-through text-gray-400" : "text-gray-700"}`}>
                                Title of the sub task
                              </span>
                            </label>
                          </div>

                          {/* three-dot for subtask actions */}
                          <div className="relative">
                            <button
                              ref={subtaskMenuBtnRef}
                              onClick={() => setSubtaskMenuOpen((s) => !s)}
                              className="p-2 rounded hover:bg-gray-100"
                              aria-label="subtask menu"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor">
                                <circle cx="5" cy="12" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>

                            {subtaskMenuOpen && (
                              <div ref={subtaskMenuRef} className="absolute right-0 top-8 w-40 bg-white border rounded-lg shadow-md p-1 z-50">
                                <button onClick={onSubtaskView} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7z" stroke="currentColor" strokeWidth="1.2" /></svg>
                                  View
                                </button>
                                <button onClick={onSubtaskEdit} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 21l3-1 11-11 2 2-11 11-1 3H3z" stroke="currentColor" strokeWidth="1.2" /></svg>
                                  Edit
                                </button>
                                <button onClick={onSubtaskDelete} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 text-red-600">
                                  <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.2" /></svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* ----- TIMESHEET TAB: new table matching screenshot ----- */}
                {tab === "timesheet" && (
                  <div className="h-full flex flex-col">
                    <div className="mt-1 flex-1 overflow-auto">
                      <div className="rounded-md overflow-hidden border">
                        {/* header row */}
                        <div className="bg-[#e8f2fb] px-4 py-3 text-sm text-gray-700 grid grid-cols-4 gap-4 items-center rounded-t-md">
                          <div className="font-medium">Employee</div>
                          <div className="font-medium">Start Time</div>
                          <div className="font-medium">End Time</div>
                          <div className="font-medium text-right">Hours Logged</div>
                        </div>

                        {/* rows */}
                        <div className="bg-white divide-y">
                          {timesheets.map((row) => (
                            <div key={row.id} className="px-4 py-4 grid grid-cols-4 gap-4 items-center text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {/* avatar fallback (no external images) */}
                                  {row.employee.profileUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={row.employee.profileUrl} alt={row.employee.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs text-gray-600">{row.employee.name.split(" ").map(n => n[0]).join("")}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{row.employee.name}</div>
                                  <div className="text-xs text-gray-500">{row.employee.role ?? ""}</div>
                                </div>
                              </div>

                              <div className="text-sm">
                                <div className="font-medium">{fmtShortDate(row.startTime)}</div>
                                <div className="text-xs text-gray-500">{fmtTime(row.startTime)}</div>
                              </div>

                              <div className="text-sm">
                                <div className="font-medium">{fmtShortDate(row.endTime)}</div>
                                <div className="text-xs text-gray-500">{fmtTime(row.endTime)}</div>
                              </div>

                              <div className="text-right">
                                <div className="font-medium">{minsToHuman(row.minutesLogged)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* footer rounded bottom */}
                        <div className="h-2 bg-white rounded-b-md" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ----- NOTES TAB ----- */}
                {tab === "notes" && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openAddNote}
                        data-add-note-btn
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                        aria-label="Add a Note"
                        title="Add a Note"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-600 text-blue-600 text-xs">+</span>
                        <span>Add a Note</span>
                      </button>
                    </div>

                    <div className="mt-4 flex-1 overflow-auto relative">
                      <div className="rounded-md overflow-hidden border relative">
                        {/* header */}
                        <div className="bg-[#e8f2fb] px-4 py-3 text-sm text-gray-700 grid grid-cols-3 gap-4 items-center">
                          <div className="font-medium">Note Title</div>
                          <div className="font-medium">Note Type</div>
                          <div className="font-medium text-right">Action</div>
                        </div>

                        {/* actions popup at top-right of this table card */}
                        {openNoteMenuId !== null && currentNote && (
                          <div data-notes-menu className="absolute right-3 top-3 z-50 w-44 bg-white border rounded-lg shadow-md p-1">
                            <button onClick={onViewNote} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                              View
                            </button>
                            <button onClick={onEditNote} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                              Edit
                            </button>
                            <button onClick={onDeleteNote} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 text-red-600">
                              Delete
                            </button>
                          </div>
                        )}

                        {/* rows */}
                        <div className="bg-white p-3 text-sm">
                          {notes.length ? (
                            <ul className="space-y-3">
                              {notes.map((note) => (
                                <li key={note.id} className="flex items-center justify-between">
                                  <div className="truncate max-w-[40%]">{note.title}</div>

                                  <div className="flex items-center gap-2 text-gray-600">
                                    {note.type === "public" ? <span>Public</span> : <span>Private</span>}
                                  </div>

                                  <div className="relative">
                                    <button
                                      data-notes-menu-btn
                                      onClick={() => onOpenNoteMenu(note)}
                                      className="p-2 rounded hover:bg-gray-100"
                                      aria-label="note actions"
                                    >
                                      <svg className="w-5 h-5 text-gray-600" fill="currentColor">
                                        <circle cx="5" cy="12" r="1.5" />
                                        <circle cx="12" cy="12" r="1.5" />
                                        <circle cx="19" cy="12" r="1.5" />
                                      </svg>
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-gray-500 p-4">No notes yet</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder confirmation modal */}
      {reminderConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div ref={reminderModalRef} role="dialog" aria-modal="true" className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Are You Sure?</h3>
              <p className="mt-3 text-sm text-gray-500">You want to send reminder to the assigned employees.</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={handleConfirmCancel} className="px-6 py-2 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmYes} className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700">Yes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subtask modal */}
      {addSubtaskOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={newSubtaskTitle}
                onChange={(e) => {
                  setNewSubtaskTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter subtask title"
                autoFocus
              />
              {titleError && <div className="mt-1 text-xs text-red-600">{titleError}</div>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newSubtaskDesc}
                onChange={(e) => setNewSubtaskDesc(e.target.value)}
                className="mt-2 w-full min-h-[90px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={onCancelAddSubtask}
                className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onSaveAddSubtask}
                className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Subtask modal */}
      {viewSubtaskOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Subtask Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="text-gray-500">Title</div>
              <div className="font-medium">Title of the sub task</div>

              <div className="text-gray-500">Description</div>
              <div className="font-medium">--</div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewSubtaskOpen(false)}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subtask modal */}
      {editSubtaskOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={editSubtaskTitle}
                onChange={(e) => {
                  setEditSubtaskTitle(e.target.value);
                  if (editTitleError) setEditTitleError(null);
                }}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter subtask title"
                autoFocus
              />
              {editTitleError && <div className="mt-1 text-xs text-red-600">{editTitleError}</div>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={editSubtaskDesc}
                onChange={(e) => setEditSubtaskDesc(e.target.value)}
                className="mt-2 w-full min-h-[90px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={onCancelEditSubtask}
                className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onUpdateSubtask}
                className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note modal */}
      {addNoteOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/30 px-4">
          <div data-add-note-modal role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Note Title <span className="text-red-500">*</span>
              </label>
              <input
                value={addNoteTitle}
                onChange={(e) => {
                  setAddNoteTitle(e.target.value);
                  if (addNoteTitleError) setAddNoteTitleError(null);
                }}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter note title"
                autoFocus
              />
              {addNoteTitleError && <div className="mt-1 text-xs text-red-600">{addNoteTitleError}</div>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Note Detail</label>
              <textarea
                value={addNoteContent}
                onChange={(e) => setAddNoteContent(e.target.value)}
                className="mt-2 w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter note details (optional)"
              />
            </div>

            <div className="mb-6 flex items-center gap-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="note-type"
                  checked={addNoteType === "public"}
                  onChange={() => setAddNoteType("public")}
                />
                <span className="text-sm">Public</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="note-type"
                  checked={addNoteType === "private"}
                  onChange={() => setAddNoteType("private")}
                />
                <span className="text-sm">Private</span>
              </label>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={cancelAddNote}
                className="px-8 py-2 rounded-full border border-blue-600 text-blue-600 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAddNote}
                className="px-8 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Note modal */}
      {viewNoteOpen && currentNote && (
        <div className="fixed inset-0 z-[86] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">View Note</h3>
              <button onClick={closeViewNote} className="p-2 rounded hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="text-gray-500">Title</div>
              <div className="font-medium">{currentNote.title}</div>

              <div className="text-gray-500">Type</div>
              <div className="font-medium">{currentNote.type === "public" ? "Public" : "Private"}</div>

              <div className="text-gray-500">Content</div>
              <div className="font-medium whitespace-pre-wrap">{currentNote.content ?? "--"}</div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={closeViewNote} className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note modal */}
      {editNoteOpen && currentNote && (
        <div className="fixed inset-0 z-[87] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Note</h3>
              <button onClick={() => { setEditNoteOpen(false); setCurrentNote(null); }} className="p-2 rounded hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <input
                value={editNoteTitle}
                onChange={(e) => setEditNoteTitle(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter note title"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={editNoteType}
                onChange={(e) => setEditNoteType(e.target.value as "public" | "private")}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={editNoteContent}
                onChange={(e) => setEditNoteContent(e.target.value)}
                className="mt-2 w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter note content (optional)"
              />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button onClick={() => { setEditNoteOpen(false); setCurrentNote(null); }} className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveNoteEdit} className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirm modal */}
      {deleteNoteConfirmOpen && currentNote && (
        <div className="fixed inset-0 z-[88] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Are you sure?</h3>
              <p className="mt-3 text-sm text-gray-500">Delete note &quot;{currentNote.title}&quot;. This action cannot be undone.</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={cancelDeleteNote} className="px-6 py-2 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteNote} className="px-6 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ EDIT TASK modal (FULL UI per screenshot) ------------------ */}
      {editTaskOpen && (
        <div className="fixed inset-0 z-[95] flex items-start justify-center pt-10 pb-10 overflow-auto bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-[980px] bg-white rounded-lg shadow-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 px-4">
              <div className="text-lg font-semibold">Update Task Details</div>
              <button onClick={() => setEditTaskOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Task Information card */}
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-3">Task Information</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600">Title <span className="text-red-500">*</span></label>
                    <input
                      value={etTitle}
                      onChange={(e) => { setEtTitle(e.target.value); if (editTaskErrors) setEditTaskErrors(null); }}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Task Name"
                    />
                  </div>

                  {/* Task Category */}
                  <div>
                    <label className="block text-sm text-gray-600">Task Category</label>
                    <div className="mt-2 flex gap-2">
                      <select value={etTaskCategory} onChange={(e) => setEtTaskCategory(e.target.value)} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">--</option>
                      </select>
                      <button onClick={onAddCategoryClick} className="px-3 py-2 rounded border bg-gray-100 text-sm">Add</button>
                    </div>
                  </div>

                  {/* Project (full width next row) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mt-2">Project <span className="text-red-500">*</span></label>
                    <select value={etProject} onChange={(e) => setEtProject(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value={task.projectName ?? ""}>{task.projectName ?? "Project Name"}</option>
                    </select>
                  </div>

                  {/* Client details area */}
                  <div>
                    <div className="text-sm text-gray-600 mt-2">Client Details</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">JD</div>
                      <div className="text-sm">
                        <div className="font-medium">John Doe</div>
                        <div className="text-xs text-gray-500">Curilo Solutions</div>
                      </div>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm text-gray-600 mt-2">Start Date</label>
                    <input
                      type="date"
                      value={etStartDate ? etStartDate.split("T")[0] : ""}
                      onChange={(e) => setEtStartDate(e.target.value ? e.target.value : null)}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm text-gray-600 mt-2">Due Date</label>
                    <input
                      type="date"
                      value={etDueDate ? etDueDate.split("T")[0] : ""}
                      onChange={(e) => setEtDueDate(e.target.value ? e.target.value : null)}
                      disabled={etWithoutDueDate}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    />
                    <label className="inline-flex items-center gap-2 mt-2 text-sm">
                      <input type="checkbox" checked={etWithoutDueDate} onChange={(e) => setEtWithoutDueDate(e.target.checked)} />
                      <span>Without Due Date</span>
                    </label>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm text-gray-600 mt-2">Status</label>
                    <select value={etStatus} onChange={(e) => setEtStatus(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="Doing">Doing</option>
                      <option value="To Do">To Do</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm text-gray-600 mt-2">Assigned To</label>
                    <select value={etAssignedTo} onChange={(e) => setEtAssignedTo(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value={etAssignedTo || ""}>{etAssignedTo || "Riya Sharma"}</option>
                    </select>
                  </div>

                  {/* Description (full width) */}
                  <div className="md:col-span-3">
                    <label className="block text-sm text-gray-600 mt-2">Description</label>
                    <textarea value={etDescription} onChange={(e) => setEtDescription(e.target.value)} className="mt-2 w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="--" />
                  </div>
                </div>
              </div>

              {/* Other Details card */}
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-3">Other Details</div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  {/* Label */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600">Label</label>
                    <div className="mt-2 flex gap-2">
                      <select value={etLabel} onChange={(e) => setEtLabel(e.target.value)} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">--</option>
                      </select>
                      <button onClick={onAddLabelClick} className="px-3 py-2 rounded border bg-gray-100 text-sm">Add</button>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600">Milestones</label>
                    <select value={etMilestone} onChange={(e) => setEtMilestone(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">--</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600">Priority</label>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${etPriority === "Low" ? "bg-green-500" : etPriority === "Medium" ? "bg-yellow-400" : etPriority === "High" ? "bg-orange-500" : "bg-red-600"}`} />
                        <select value={etPriority} onChange={(e) => setEtPriority(e.target.value as any)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Make Private */}
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={etMakePrivate} onChange={(e) => setEtMakePrivate(e.target.checked)} />
                      <span className="text-sm">Make Private</span>
                    </label>
                  </div>

                  {/* Time Estimate */}
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={etTimeEstimateChecked} onChange={(e) => setEtTimeEstimateChecked(e.target.checked)} />
                      <span className="text-sm">Time Estimate</span>
                    </label>
                    {etTimeEstimateChecked && (
                      <div className="mt-2">
                        <input type="number" min={0} value={etTimeEstimateMins} onChange={(e) => setEtTimeEstimateMins(e.target.value === "" ? "" : Number(e.target.value))} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-500">mins</span>
                      </div>
                    )}
                  </div>

                  {/* Task is dependent */}
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={etDependentChecked} onChange={(e) => setEtDependentChecked(e.target.checked)} />
                      <span className="text-sm">Task is dependent on other task</span>
                    </label>

                    {etDependentChecked && (
                      <div className="mt-2">
                        <label className="block text-sm text-gray-600">Dependent Task <span className="text-red-500">*</span></label>
                        <select value={etDependentTask} onChange={(e) => setEtDependentTask(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Task Name</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Add File drop area (full width) */}
                  <div className="md:col-span-6 mt-2">
                    <label className="block text-sm text-gray-600 mb-2">Add File</label>
                    <div
                      onClick={onChooseFileClick}
                      className="w-full min-h-[80px] rounded-md border-dashed border-2 border-gray-200 flex items-center justify-center text-sm text-gray-500 cursor-pointer"
                    >
                      {etFile ? (
                        <div className="text-sm">
                          <div className="font-medium">{etFile.name}</div>
                          <div className="text-xs text-gray-500">{(etFile.size / 1024).toFixed(1)} KB</div>
                        </div>
                      ) : (
                        <div>Choose a file</div>
                      )}
                    </div>
                    <input type="file" onChange={onHiddenFilePicked} className="hidden" />
                  </div>
                </div>

                {/* error message */}
                {editTaskErrors && <div className="mt-3 text-sm text-red-600">{editTaskErrors}</div>}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3">
                <button onClick={onCancelEditTask} className="px-4 py-2 border rounded-md text-sm border-blue-600 text-blue-600 hover:bg-gray-50">Cancel</button>
                <button onClick={onUpdateTask} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ------------------ END EDIT TASK modal ------------------ */}

    </div>
  );
}
