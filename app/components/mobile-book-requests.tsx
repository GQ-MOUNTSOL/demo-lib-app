"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Smartphone, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingBook {
  id: string
  title: string
  author?: string
  requestedBy: string
  timestamp: string
  status: "pending" | "approved" | "rejected"
  deviceInfo?: any
}

interface MobileBookRequestsProps {
  onBookApproved: (book: PendingBook) => void
}

export function MobileBookRequests({ onBookApproved }: MobileBookRequestsProps) {
  const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchPendingBooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/mobile/books/pending")
      const data = await response.json()

      if (data.success) {
        setPendingBooks(data.books)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error fetching pending books:", error)
      toast({
        title: "Error",
        description: "Failed to fetch pending book requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookAction = async (bookId: string, action: "approve" | "reject") => {
    setProcessingIds((prev) => new Set(prev).add(bookId))

    try {
      const response = await fetch("/api/mobile/books/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
          action,
          adminId: "admin-user", // Replace with actual admin ID
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove from pending list
        setPendingBooks((prev) => prev.filter((book) => book.id !== bookId))

        // If approved, notify parent component
        if (action === "approve") {
          onBookApproved(data.book)
        }

        toast({
          title: "Success",
          description: `Book ${action}d successfully`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error(`Error ${action}ing book:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} book`,
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchPendingBooks()
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchPendingBooks, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile App Requests
            </CardTitle>
            <CardDescription>Books requested from mobile app awaiting admin approval</CardDescription>
          </div>
          <Button onClick={fetchPendingBooks} disabled={isLoading} size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading pending requests...</div>
        ) : pendingBooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending book requests</div>
        ) : (
          <div className="space-y-4">
            {pendingBooks.map((book) => (
              <div key={book.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{book.title}</h3>
                    {book.author && <p className="text-sm text-gray-600">by {book.author}</p>}
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {book.requestedBy}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(book.timestamp)}
                  </div>
                </div>

                {book.deviceInfo && (
                  <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                    Device: {book.deviceInfo.platform || "Unknown"} | Version: {book.deviceInfo.version || "Unknown"}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleBookAction(book.id, "approve")}
                    disabled={processingIds.has(book.id)}
                    size="sm"
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve & Send to Make.com
                  </Button>
                  <Button
                    onClick={() => handleBookAction(book.id, "reject")}
                    disabled={processingIds.has(book.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
