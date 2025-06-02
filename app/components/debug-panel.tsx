"use client"

import { useState } from "react"
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

      let payload;
      try {
        payload = JSON.parse(customPayload)
      } catch (parseError) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON syntax",
          variant: "destructive",
        })
        setIsLoading(false)
        return;
      }

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
      const errorInfo = {
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : "Unknown",
        timestamp: new Date().toISOString(),
      }

      setLastResponse(JSON.stringify(errorInfo, null, 2))

      toast({
        title: "Debug Request Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.\
