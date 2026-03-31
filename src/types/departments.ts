export interface Department {
    id: number
    departmentName: string
    parentDepartmentId: number | null
    parentDepartmentName: string | null
    createAt: string
  }
  