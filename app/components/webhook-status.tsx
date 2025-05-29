"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { RealTimeStatus } from "./real-time-status"

interface WebhookLog {
  id: string
  timestamp: string
  status: "success" | "pending" | "error"
  bookTitle?: string
  message: string
}

export function WebhookStatus() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    {
      id: "1",
      timestamp: new Date().toISOString(),
      status: "success",
      bookTitle: "The Alchemist",
      message: "Book analysis completed via Make.com webhook",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: "pending",
      bookTitle: "To Kill a Mockingbird",
      message: "Processing book analysis through Make.com automation",
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 mb-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Make.com Integration Status
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </CardTitle>
              <CardDescription>Recent Make.com webhook activity and book analysis status</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {webhookLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium text-sm">{log.bookTitle || "Unknown Book"}</p>
                    <p className="text-xs text-gray-600">{log.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(log.status)}
                  <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <RealTimeStatus />
    </div>
  )
}
