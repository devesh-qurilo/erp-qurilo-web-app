"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Users,
  DollarSign,
  Edit,
  Download,
  Settings,
  Shield,
  Clock,
  Globe,
} from "lucide-react"
import { format } from "date-fns"

interface Employee {
  employeeId: string
  name: string
  email: string
  profilePictureUrl: string
  gender: string
  birthday: string
  bloodGroup: string
  joiningDate: string
  language: string
  country: string
  mobile: string
  address: string
  about: string
  departmentId: number
  departmentName: string
  designationId: number
  designationName: string
  reportingToId: string
  reportingToName: string
  role: string
  loginAllowed: boolean
  receiveEmailNotification: boolean
  hourlyRate: number
  slackMemberId: string
  skills: string[]
  probationEndDate: string
  noticePeriodStartDate: string | null
  noticePeriodEndDate: string | null
  employmentType: string
  maritalStatus: string
  businessAddress: string
  officeShift: string
  active: boolean
  createdAt: string
}

export default function ProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }

        const data = await response.json()
        setEmployee(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center max-w-screen-xl w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center max-w-screen-xl w-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex justify-center items-center max-w-screen-xl w-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">No profile data available</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col max-w-9xl w-full p-0 justify-center">
      {/* Header Section */}
      <Card className="mb-6 w-[800px] mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={employee.profilePictureUrl || "/placeholder.svg"}
                alt={employee.name}
              />
              <AvatarFallback className="text-2xl">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{employee.name}</h1>
                  <p className="text-lg text-muted-foreground">{employee.designationName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{employee.departmentName}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Badge variant={employee.active ? "default" : "secondary"}>
                      {employee.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{employee.employmentType}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{employee.mobile}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{employee.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{employee.country}</span>
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Employment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{employee.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium">{
                  // new Date(employee.joiningDate).toLocaleDateString()
                  format(new Date(employee.joiningDate), "dd-MM-yyyy")
                  }</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reporting To</p>
                  <p className="font-medium">{employee.reportingToName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Office Shift</p>
                  <p className="font-medium">{employee.officeShift}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Compensation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-2xl font-bold">${employee.hourlyRate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employment Type</p>
                  <Badge variant="outline">{employee.employmentType}</Badge>
                </div>
                {employee.probationEndDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Probation End</p>
                    <p className="font-medium">{
                    // new Date(employee.probationEndDate).toLocaleDateString()
                    format(new Date(employee.probationEndDate), "dd-MM-yyyy")
                    }</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skills and About */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{employee.about}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{employee.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{employee.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{employee.departmentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Designation</p>
                    <p className="font-medium">{employee.designationName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{
                    // new Date(employee.joiningDate).toLocaleDateString()
                    format(new Date(employee.joiningDate), "dd-MM-yyyy")
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Type</p>
                    <p className="font-medium">{employee.employmentType}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Business Address</p>
                  <p className="font-medium">{employee.businessAddress}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Reporting & Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reports To</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{employee.reportingToName}</span>
                    <Badge variant="outline" className="text-xs">
                      {employee.reportingToId}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Office Shift</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{employee.officeShift}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slack Member ID</p>
                  <p className="font-medium">{employee.slackMemberId}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{employee.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marital Status</p>
                    <p className="font-medium">{employee.maritalStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Birthday</p>
                    <p className="font-medium">{
                    // new Date(employee.birthday).toLocaleDateString()
                    format(new Date(employee.birthday), "dd-MM-yyyy")
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{employee.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="font-medium">{employee.language}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium">{employee.country}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{employee.address}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Notice Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.noticePeriodStartDate && employee.noticePeriodEndDate ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Notice Period Start</p>
                      <p className="font-medium">{
                      // new Date(employee.noticePeriodStartDate).toLocaleDateString()
                      format(new Date(employee.noticePeriodStartDate), "dd-MM-yyyy")
                      }</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Notice Period End</p>
                      <p className="font-medium">{
                      // new Date(employee.noticePeriodEndDate).toLocaleDateString()
                      format(new Date(employee.noticePeriodEndDate), "dd-MM-yyyy")
                      }</p>
                    </div>
                    <Badge variant="destructive">Notice Period Active</Badge>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active notice period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Login Access</p>
                      <p className="text-sm text-muted-foreground">System login permissions</p>
                    </div>
                  </div>
                  <Badge variant={employee.loginAllowed ? "default" : "secondary"}>
                    {employee.loginAllowed ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive email updates</p>
                    </div>
                  </div>
                  <Badge variant={employee.receiveEmailNotification ? "default" : "secondary"}>
                    {employee.receiveEmailNotification ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-muted-foreground">Employee account status</p>
                    </div>
                  </div>
                  <Badge variant={employee.active ? "default" : "secondary"}>
                    {employee.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Account Created</p>
                <p className="font-medium">{
                // new Date(employee.createdAt).toLocaleDateString()
                format(new Date(employee.createdAt), "dd-MM-yyyy")
                }</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}