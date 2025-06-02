"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Copy, Send, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DebugPanel() {
  const [customPayload, setCustomPayload] = useState(`{
  "prompt1": "Test prompt 1",
  "prompt2": "The Alchemist",
  "prompt3": "Author of The Alchemist",
  "prompt4": "Test prompt 4"
}`)
  const [lastResponse, setLastResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/mxx7c2hgingefxsjskc2xyestvoho7rq"

  const sendCustomPayload = async () => {
    try {
      setIsLoading(true)

      const payload = JSON.parse(customPayload)

      console.log("Sending custom payload:", payload)

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()

      const debugInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        timestamp: new Date().toISOString(),
      }

      setLastResponse(JSON.stringify(debugInfo, null, 2))

      if (response.ok) {
        toast({
          title: "Debug Request Successful",
          description: `Status: ${response.status}`,
        })
      } else {
        toast({
          title: "Debug Request Failed",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      let errorMessage = "An unknown error occurred"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      const errorInfo = {
        error: errorMessage,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
      }

      setLastResponse(JSON.stringify(errorInfo, null, 2))

      toast({
        title: "Debug Request Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Debug Panel
          </CardTitle>
          <CardDescription>Test your Make.com webhook with custom payloads and view detailed responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-payload">Custom Payload (JSON)</Label>
            <Textarea
              id="custom-payload"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="font-mono text-sm"
              rows={8}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={sendCustomPayload} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Sending..." : "Send Test Request"}
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(customPayload)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Payload
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastResponse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Last Response</CardTitle>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(lastResponse)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Response
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">{lastResponse}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <Badge variant="destructive" className="mb-2">
                HTTP 500 Error
              </Badge>
              <p className="text-sm text-red-700">
                • Check if your Make.com scenario is active and published
                <br />• Verify the webhook URL is correct
                <br />• Ensure your scenario can handle the payload structure
              </p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <Badge className="bg-yellow-100 text-yellow-800 mb-2">CORS Issues</Badge>
              <p className="text-sm text-yellow-700">
                • Make.com webhooks should handle CORS automatically
                <br />• Try testing from a different browser or incognito mode
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <Badge className="bg-blue-100 text-blue-800 mb-2">Network Issues</Badge>
              <p className="text-sm text-blue-700">
                • Check your internet connection
                <br />• Try the request from Postman or curl to isolate the issue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
