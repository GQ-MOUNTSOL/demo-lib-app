"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MongoDBStatus() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const { toast } = useToast()

  const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/mxx7c2hgingefxsjskc2xyestvoho7rq"

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const testPayload = {
        action: "test_connection",
        requestType: "mongoDBStatus",
        timestamp: new Date().toISOString(),
      }

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testPayload),
        mode: "cors",
      })

      if (response.ok) {
        setConnectionStatus("connected")
        toast({
          title: "MongoDB Connected",
          description: "Successfully connected to MongoDB via Make.com",
        })
      } else {
        setConnectionStatus("error")
        toast({
          title: "Connection Failed",
          description: "Unable to connect to MongoDB via Make.com",
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus("error")
      toast({
        title: "Connection Error",
        description: "Failed to test MongoDB connection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              MongoDB Status (via Make.com)
              <Badge
                className={
                  connectionStatus === "connected"
                    ? "bg-green-100 text-green-800"
                    : connectionStatus === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                }
              >
                {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Error" : "Unknown"}
              </Badge>
            </CardTitle>
            <CardDescription>MongoDB connection via Make.com webhook integration</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Test Connection
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm">Database</span>
            </div>
            <p className="text-sm text-gray-600">demo0</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-sm">Collection</span>
            </div>
            <p className="text-sm text-gray-600">processed_books</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {connectionStatus === "connected" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="font-semibold text-sm">Connection</span>
            </div>
            <p className="text-sm text-gray-600">Via Make.com</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">MongoDB Setup in Make.com:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Add MongoDB module to your Make.com scenario</div>
            <div>• Use connection string: mongodb+srv://gqmountsol:***@demo0.pmagwui.mongodb.net</div>
            <div>• Configure "Insert Document" for storing processed books</div>
            <div>• Configure "Find Documents" for fetching all books</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
