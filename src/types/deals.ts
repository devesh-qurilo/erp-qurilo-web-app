export interface EmployeeMeta {
    employeeId: string;
    name: string;
    designation: string | null;
    department: string | null;
    profileUrl: string;
  }
  
  export interface Followup {
    id: number;
    nextDate: string;
    startTime: string;
    remarks: string;
    sendReminder: boolean;
    reminderSent: boolean;
    createdAt: string;
  }
  
  export interface Comment {
    id: number;
    employeeId: string;
    commentText: string;
    createdAt: string;
  }
  
  export interface Deal {
    id: number;
    title: string;
    value: number;
    dealStage: string;
    dealAgent: string;
    dealWatchers: string[];
    leadId: number;
    pipeline: string;
    dealCategory: string;
    createdAt: string;
    updatedAt: string;
    followups: Followup[];
    tags: string[];
    comments: Comment[];
    assignedEmployeesMeta: EmployeeMeta[];
    dealAgentMeta: EmployeeMeta;
    dealWatchersMeta: EmployeeMeta[];
    dealContact: string;
    expectedCloseDate: string;
  }