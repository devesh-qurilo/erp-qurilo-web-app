"use client";

import type { Deal } from "@/types/deals";
import { create } from "zustand";

export type DealDetail = Deal & {
  leadName?: string;
  leadEmail?: string;
  leadMobile?: string;
  leadCompany?: string;
};

export type DocumentItem = {
  id: number;
  filename: string;
  url: string;
  uploadedAt: string;
};

export type Followup = {
  id?: number;
  nextDate: string;
  startTime: string;
  remarks?: string;
  sendReminder?: boolean;
  remindBefore?: number;
  remindUnit?: "DAYS" | "HOURS" | "MINUTES" | string;
  status?: "PENDING" | "CANCELLED" | "COMPLETED" | string;
};

export type Employee = {
  employeeId: string;
  name: string;
  designation?: string;
  department?: string;
  profileUrl?: string;
};

export type NoteItem = {
  id?: number;
  noteTitle: string;
  noteType: "PUBLIC" | "PRIVATE" | string;
  noteDetails?: string;
  createdBy?: string;
  createdAt?: string;
};

export type TagItem = {
  id?: number;
  tagName: string;
};

export type TabKey = "files" | "followups" | "people" | "notes" | "comments" | "tags";

type MenuPosition = {
  top: number;
  left: number;
} | null;

type Updater<T> = T | ((previous: T) => T);

const resolveUpdater = <T>(previous: T, next: Updater<T>) =>
  typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

type DealDetailState = {
  deal: DealDetail | null;
  loading: boolean;
  error: string | null;
  activeTab: TabKey;
  documents: DocumentItem[];
  docEmployeeIds: string[];
  docsLoading: boolean;
  docsError: string | null;
  selectedFile: File | null;
  selectedFileName: string | null;
  uploading: boolean;
  followups: Followup[];
  followupsLoading: boolean;
  followupsError: string | null;
  isFollowupModalOpen: boolean;
  editingFollowup: Followup | null;
  followupSaving: boolean;
  assignedEmployees: Employee[];
  employeesLoading: boolean;
  employeesError: string | null;
  isAddPeopleOpen: boolean;
  allEmployeesPool: Employee[];
  availableToAdd: Employee[];
  departments: string[];
  selectedAddEmployeeId: string | null;
  selectedDepartment: string;
  peopleSaving: boolean;
  peopleDeletingId: string | null;
  peopleSearch: string;
  notes: NoteItem[];
  notesLoading: boolean;
  notesError: string | null;
  isNoteModalOpen: boolean;
  noteModalMode: "add" | "edit" | "view";
  editingNote: NoteItem | null;
  noteSaving: boolean;
  noteDeletingId: number | null;
  tags: (TagItem | string)[];
  tagsLoading: boolean;
  tagsError: string | null;
  isAddTagOpen: boolean;
  tagValue: string;
  tagSaving: boolean;
  tagDeletingId: number | null;
  isAddCommentOpen: boolean;
  commentText: string;
  commentSaving: boolean;
  commentDeletingId: number | null;
  openActionMenu: string | null;
  menuPosition: MenuPosition;
  editingFollowupData: Followup | null;
  noteActionData: NoteItem | null;
  noteActionMode: "view" | "edit" | null;
  setDeal: (deal: Updater<DealDetail | null>) => void;
  setLoading: (loading: Updater<boolean>) => void;
  setError: (error: Updater<string | null>) => void;
  setActiveTab: (activeTab: Updater<TabKey>) => void;
  setDocuments: (documents: Updater<DocumentItem[]>) => void;
  setDocEmployeeIds: (docEmployeeIds: Updater<string[]>) => void;
  setDocsLoading: (docsLoading: Updater<boolean>) => void;
  setDocsError: (docsError: Updater<string | null>) => void;
  setSelectedFile: (selectedFile: Updater<File | null>) => void;
  setSelectedFileName: (selectedFileName: Updater<string | null>) => void;
  setUploading: (uploading: Updater<boolean>) => void;
  setFollowups: (followups: Updater<Followup[]>) => void;
  setFollowupsLoading: (followupsLoading: Updater<boolean>) => void;
  setFollowupsError: (followupsError: Updater<string | null>) => void;
  setIsFollowupModalOpen: (isFollowupModalOpen: Updater<boolean>) => void;
  setEditingFollowup: (editingFollowup: Updater<Followup | null>) => void;
  setFollowupSaving: (followupSaving: Updater<boolean>) => void;
  setAssignedEmployees: (assignedEmployees: Updater<Employee[]>) => void;
  setEmployeesLoading: (employeesLoading: Updater<boolean>) => void;
  setEmployeesError: (employeesError: Updater<string | null>) => void;
  setIsAddPeopleOpen: (isAddPeopleOpen: Updater<boolean>) => void;
  setAllEmployeesPool: (allEmployeesPool: Updater<Employee[]>) => void;
  setAvailableToAdd: (availableToAdd: Updater<Employee[]>) => void;
  setDepartments: (departments: Updater<string[]>) => void;
  setSelectedAddEmployeeId: (selectedAddEmployeeId: Updater<string | null>) => void;
  setSelectedDepartment: (selectedDepartment: Updater<string>) => void;
  setPeopleSaving: (peopleSaving: Updater<boolean>) => void;
  setPeopleDeletingId: (peopleDeletingId: Updater<string | null>) => void;
  setPeopleSearch: (peopleSearch: Updater<string>) => void;
  setNotes: (notes: Updater<NoteItem[]>) => void;
  setNotesLoading: (notesLoading: Updater<boolean>) => void;
  setNotesError: (notesError: Updater<string | null>) => void;
  setIsNoteModalOpen: (isNoteModalOpen: Updater<boolean>) => void;
  setNoteModalMode: (noteModalMode: Updater<"add" | "edit" | "view">) => void;
  setEditingNote: (editingNote: Updater<NoteItem | null>) => void;
  setNoteSaving: (noteSaving: Updater<boolean>) => void;
  setNoteDeletingId: (noteDeletingId: Updater<number | null>) => void;
  setTags: (tags: Updater<(TagItem | string)[]>) => void;
  setTagsLoading: (tagsLoading: Updater<boolean>) => void;
  setTagsError: (tagsError: Updater<string | null>) => void;
  setIsAddTagOpen: (isAddTagOpen: Updater<boolean>) => void;
  setTagValue: (tagValue: Updater<string>) => void;
  setTagSaving: (tagSaving: Updater<boolean>) => void;
  setTagDeletingId: (tagDeletingId: Updater<number | null>) => void;
  setIsAddCommentOpen: (isAddCommentOpen: Updater<boolean>) => void;
  setCommentText: (commentText: Updater<string>) => void;
  setCommentSaving: (commentSaving: Updater<boolean>) => void;
  setCommentDeletingId: (commentDeletingId: Updater<number | null>) => void;
  setOpenActionMenu: (openActionMenu: Updater<string | null>) => void;
  setMenuPosition: (menuPosition: Updater<MenuPosition>) => void;
  setEditingFollowupData: (editingFollowupData: Updater<Followup | null>) => void;
  setNoteActionData: (noteActionData: Updater<NoteItem | null>) => void;
  setNoteActionMode: (noteActionMode: Updater<"view" | "edit" | null>) => void;
  resetDealDetailState: () => void;
};

type DealDetailStoreState = Omit<
  DealDetailState,
  | "setDeal"
  | "setLoading"
  | "setError"
  | "setActiveTab"
  | "setDocuments"
  | "setDocEmployeeIds"
  | "setDocsLoading"
  | "setDocsError"
  | "setSelectedFile"
  | "setSelectedFileName"
  | "setUploading"
  | "setFollowups"
  | "setFollowupsLoading"
  | "setFollowupsError"
  | "setIsFollowupModalOpen"
  | "setEditingFollowup"
  | "setFollowupSaving"
  | "setAssignedEmployees"
  | "setEmployeesLoading"
  | "setEmployeesError"
  | "setIsAddPeopleOpen"
  | "setAllEmployeesPool"
  | "setAvailableToAdd"
  | "setDepartments"
  | "setSelectedAddEmployeeId"
  | "setSelectedDepartment"
  | "setPeopleSaving"
  | "setPeopleDeletingId"
  | "setPeopleSearch"
  | "setNotes"
  | "setNotesLoading"
  | "setNotesError"
  | "setIsNoteModalOpen"
  | "setNoteModalMode"
  | "setEditingNote"
  | "setNoteSaving"
  | "setNoteDeletingId"
  | "setTags"
  | "setTagsLoading"
  | "setTagsError"
  | "setIsAddTagOpen"
  | "setTagValue"
  | "setTagSaving"
  | "setTagDeletingId"
  | "setIsAddCommentOpen"
  | "setCommentText"
  | "setCommentSaving"
  | "setCommentDeletingId"
  | "setOpenActionMenu"
  | "setMenuPosition"
  | "setEditingFollowupData"
  | "setNoteActionData"
  | "setNoteActionMode"
  | "resetDealDetailState"
>;

const initialState: DealDetailStoreState = {
  deal: null,
  loading: true,
  error: null,
  activeTab: "files",
  documents: [],
  docEmployeeIds: [],
  docsLoading: false,
  docsError: null,
  selectedFile: null,
  selectedFileName: null,
  uploading: false,
  followups: [],
  followupsLoading: false,
  followupsError: null,
  isFollowupModalOpen: false,
  editingFollowup: null,
  followupSaving: false,
  assignedEmployees: [],
  employeesLoading: false,
  employeesError: null,
  isAddPeopleOpen: false,
  allEmployeesPool: [],
  availableToAdd: [],
  departments: [],
  selectedAddEmployeeId: null,
  selectedDepartment: "",
  peopleSaving: false,
  peopleDeletingId: null,
  peopleSearch: "",
  notes: [],
  notesLoading: false,
  notesError: null,
  isNoteModalOpen: false,
  noteModalMode: "add",
  editingNote: null,
  noteSaving: false,
  noteDeletingId: null,
  tags: [],
  tagsLoading: false,
  tagsError: null,
  isAddTagOpen: false,
  tagValue: "",
  tagSaving: false,
  tagDeletingId: null,
  isAddCommentOpen: false,
  commentText: "",
  commentSaving: false,
  commentDeletingId: null,
  openActionMenu: null,
  menuPosition: null,
  editingFollowupData: null,
  noteActionData: null,
  noteActionMode: null,
};

const setField =
  <Key extends keyof DealDetailStoreState>(key: Key) =>
  (next: Updater<DealDetailStoreState[Key]>) =>
  (state: DealDetailState) => ({
    [key]: resolveUpdater(state[key], next),
  });

export const useDealDetailStore = create<DealDetailState>((set) => ({
  ...initialState,
  setDeal: (deal) => set(setField("deal")(deal)),
  setLoading: (loading) => set(setField("loading")(loading)),
  setError: (error) => set(setField("error")(error)),
  setActiveTab: (activeTab) => set(setField("activeTab")(activeTab)),
  setDocuments: (documents) => set(setField("documents")(documents)),
  setDocEmployeeIds: (docEmployeeIds) => set(setField("docEmployeeIds")(docEmployeeIds)),
  setDocsLoading: (docsLoading) => set(setField("docsLoading")(docsLoading)),
  setDocsError: (docsError) => set(setField("docsError")(docsError)),
  setSelectedFile: (selectedFile) => set(setField("selectedFile")(selectedFile)),
  setSelectedFileName: (selectedFileName) => set(setField("selectedFileName")(selectedFileName)),
  setUploading: (uploading) => set(setField("uploading")(uploading)),
  setFollowups: (followups) => set(setField("followups")(followups)),
  setFollowupsLoading: (followupsLoading) => set(setField("followupsLoading")(followupsLoading)),
  setFollowupsError: (followupsError) => set(setField("followupsError")(followupsError)),
  setIsFollowupModalOpen: (isFollowupModalOpen) =>
    set(setField("isFollowupModalOpen")(isFollowupModalOpen)),
  setEditingFollowup: (editingFollowup) => set(setField("editingFollowup")(editingFollowup)),
  setFollowupSaving: (followupSaving) => set(setField("followupSaving")(followupSaving)),
  setAssignedEmployees: (assignedEmployees) => set(setField("assignedEmployees")(assignedEmployees)),
  setEmployeesLoading: (employeesLoading) => set(setField("employeesLoading")(employeesLoading)),
  setEmployeesError: (employeesError) => set(setField("employeesError")(employeesError)),
  setIsAddPeopleOpen: (isAddPeopleOpen) => set(setField("isAddPeopleOpen")(isAddPeopleOpen)),
  setAllEmployeesPool: (allEmployeesPool) => set(setField("allEmployeesPool")(allEmployeesPool)),
  setAvailableToAdd: (availableToAdd) => set(setField("availableToAdd")(availableToAdd)),
  setDepartments: (departments) => set(setField("departments")(departments)),
  setSelectedAddEmployeeId: (selectedAddEmployeeId) =>
    set(setField("selectedAddEmployeeId")(selectedAddEmployeeId)),
  setSelectedDepartment: (selectedDepartment) =>
    set(setField("selectedDepartment")(selectedDepartment)),
  setPeopleSaving: (peopleSaving) => set(setField("peopleSaving")(peopleSaving)),
  setPeopleDeletingId: (peopleDeletingId) => set(setField("peopleDeletingId")(peopleDeletingId)),
  setPeopleSearch: (peopleSearch) => set(setField("peopleSearch")(peopleSearch)),
  setNotes: (notes) => set(setField("notes")(notes)),
  setNotesLoading: (notesLoading) => set(setField("notesLoading")(notesLoading)),
  setNotesError: (notesError) => set(setField("notesError")(notesError)),
  setIsNoteModalOpen: (isNoteModalOpen) => set(setField("isNoteModalOpen")(isNoteModalOpen)),
  setNoteModalMode: (noteModalMode) => set(setField("noteModalMode")(noteModalMode)),
  setEditingNote: (editingNote) => set(setField("editingNote")(editingNote)),
  setNoteSaving: (noteSaving) => set(setField("noteSaving")(noteSaving)),
  setNoteDeletingId: (noteDeletingId) => set(setField("noteDeletingId")(noteDeletingId)),
  setTags: (tags) => set(setField("tags")(tags)),
  setTagsLoading: (tagsLoading) => set(setField("tagsLoading")(tagsLoading)),
  setTagsError: (tagsError) => set(setField("tagsError")(tagsError)),
  setIsAddTagOpen: (isAddTagOpen) => set(setField("isAddTagOpen")(isAddTagOpen)),
  setTagValue: (tagValue) => set(setField("tagValue")(tagValue)),
  setTagSaving: (tagSaving) => set(setField("tagSaving")(tagSaving)),
  setTagDeletingId: (tagDeletingId) => set(setField("tagDeletingId")(tagDeletingId)),
  setIsAddCommentOpen: (isAddCommentOpen) => set(setField("isAddCommentOpen")(isAddCommentOpen)),
  setCommentText: (commentText) => set(setField("commentText")(commentText)),
  setCommentSaving: (commentSaving) => set(setField("commentSaving")(commentSaving)),
  setCommentDeletingId: (commentDeletingId) => set(setField("commentDeletingId")(commentDeletingId)),
  setOpenActionMenu: (openActionMenu) => set(setField("openActionMenu")(openActionMenu)),
  setMenuPosition: (menuPosition) => set(setField("menuPosition")(menuPosition)),
  setEditingFollowupData: (editingFollowupData) =>
    set(setField("editingFollowupData")(editingFollowupData)),
  setNoteActionData: (noteActionData) => set(setField("noteActionData")(noteActionData)),
  setNoteActionMode: (noteActionMode) => set(setField("noteActionMode")(noteActionMode)),
  resetDealDetailState: () => set({ ...initialState }),
}));
