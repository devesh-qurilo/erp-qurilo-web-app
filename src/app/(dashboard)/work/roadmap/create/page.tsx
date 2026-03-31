"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const form = e.currentTarget
    const formData = new FormData(form)

    formData.set("noDeadline", form.noDeadline.checked ? "true" : "false")
    formData.set("tasksNeedAdminApproval", form.tasksNeedAdminApproval.checked ? "true" : "false")
    formData.set("allowManualTimeLogs", form.allowManualTimeLogs.checked ? "true" : "false")

    const token = localStorage.getItem("accessToken")
    if (!token) {
      setMessage("No token found!")
      setMessageType("error")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/work/project", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg =
          typeof data?.error === "string" ? data.error : data?.error?.message || data?.message || JSON.stringify(data)

        setMessage(errorMsg)
        setMessageType("error")
      } else {
        setMessage("Project created successfully!")
        setMessageType("success")
        form.reset()
      }
    } catch (error) {
      console.error(error)
      setMessage("Error submitting form")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create New Project</h1>
          <p className="text-muted-foreground">Set up a new project with all the necessary details</p>
        </div>

        {/* Alert Messages */}
        {message && (
          <Alert
            className={`mb-6 ${messageType === "success" ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"}`}
          >
            <div className="flex items-center gap-2">
              {messageType === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  messageType === "success" ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                }
              >
                {message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <form onSubmit={handleCreateProject} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Project name, code, and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <Input name="projectName" placeholder="Enter project name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Short Code *</label>
                  <Input name="shortCode" placeholder="e.g., PROJ-001" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <Input type="date" name="startDate" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline</label>
                  <Input type="date" name="deadline" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <input type="checkbox" name="noDeadline" id="noDeadline" className="w-4 h-4" />
                <label htmlFor="noDeadline" className="text-sm font-medium cursor-pointer">
                  No Deadline
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Category, department, and client information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Category</label>
                  <Input name="projectCategory" placeholder="e.g., Web Development" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department ID</label>
                  <Input type="number" name="departmentId" placeholder="Enter department ID" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client ID</label>
                  <Input name="clientId" placeholder="Enter client ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assigned Employee IDs *</label>
                  <Input name="assignedEmployeeIds" placeholder="1,2,3" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Summary</label>
                <Textarea name="projectSummary" placeholder="Describe your project..." rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Budget & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Budget & Timeline</CardTitle>
              <CardDescription>Financial and time estimates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <Input name="currency" placeholder="USD / USD" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project Budget</label>
                  <Input type="number" name="projectBudget" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hours Estimate</label>
                  <Input type="number" name="hoursEstimate" placeholder="0" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Project configuration and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <input type="checkbox" name="tasksNeedAdminApproval" id="tasksNeedAdminApproval" className="w-4 h-4" />
                <label htmlFor="tasksNeedAdminApproval" className="text-sm font-medium cursor-pointer">
                  Tasks Need Admin Approval
                </label>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <input type="checkbox" name="allowManualTimeLogs" id="allowManualTimeLogs" className="w-4 h-4" />
                <label htmlFor="allowManualTimeLogs" className="text-sm font-medium cursor-pointer">
                  Allow Manual Time Logs 
                </label>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Optional company file attachment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input type="file" name="companyFile" className="hidden" id="fileInput" />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Any file type accepted</p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1 h-11 text-base font-semibold">
              {loading ? "Creating Project..." : "Create Project"}
            </Button>
            <Button type="reset" variant="outline" className="flex-1 h-11 text-base font-semibold bg-transparent">
              Clear Form
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
