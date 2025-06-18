"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface ActivityLog {
  id: string
  type: "sent" | "received" | "error"
  message: string
  timestamp: string
  bookTitle?: string
}

export function RealTimeStatus() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate real-time activity updates
    const interval = setInterval(() => {
      // In a real implementation, this would connect to WebSocket or poll an API
      checkForNewActivity()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const checkForNewActivity = async () => {
    try {
      // This would be a real API call to check for new activity
      const response = await fetch("http://localhost:5000/api/activity-log")
      if (response.ok) {
        const newActivities = await response.json()
        setActivities(newActivities)
        setIsConnected(true)
      }
    } catch (error) {
      setIsConnected(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sent":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "received":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
      case "received":
        return <Badge className="bg-green-100 text-green-800">Received</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Real-Time Activity
              <Badge className={isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
            <CardDescription>Live updates from your Make.com integration</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkForNewActivity}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-xs mt-1">Activity will appear here as books are processed</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="font-medium text-sm">{activity.message}</p>
                    {activity.bookTitle && <p className="text-xs text-gray-600">Book: {activity.bookTitle}</p>}
                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {getActivityBadge(activity.type)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
