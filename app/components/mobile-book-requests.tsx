"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, Smartphone, User, Calendar, Plus, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingBook {
  id: string
  title: string
  author?: string
  requestedBy: string
  timestamp: string
  status: "pending" | "approved" | "rejected"
  deviceInfo?: any
  processedBy?: string
  processedAt?: string
}

interface MobileBookRequestsProps {
  onBookApproved: (book: PendingBook) => void
}

export function MobileBookRequests({ onBookApproved }: MobileBookRequestsProps) {
  const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([])
  const [approvedBooks, setApprovedBooks] = useState<PendingBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("pending")

  // Form state for adding dummy data
  const [newBookTitle, setNewBookTitle] = useState("")
  const [newBookAuthor, setNewBookAuthor] = useState("")
  const [newBookRequester, setNewBookRequester] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const fetchPendingBooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/mobile/books/pending")
      const data = await response.json()

      if (data.success) {
        setPendingBooks(data.books || [])
        console.log("Fetched pending books:", data.books)
      } else {
        throw new Error(data.error || "Failed to fetch pending books")
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

  const fetchApprovedBooks = async () => {
    try {
      const response = await fetch("/api/mobile/books/approved")
      const data = await response.json()

      if (data.success) {
        setApprovedBooks(data.books || [])
        console.log("Fetched approved books:", data.books)
      } else {
        console.error("Failed to fetch approved books:", data.error)
      }
    } catch (error) {
      console.error("Error fetching approved books:", error)
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
          adminId: "admin-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove from pending list
        const approvedBook = pendingBooks.find((book) => book.id === bookId)
        setPendingBooks((prev) => prev.filter((book) => book.id !== bookId))

        // If approved, add to approved list and notify parent
        if (action === "approve" && approvedBook) {
          const updatedBook = { ...approvedBook, status: "approved" as const, processedAt: new Date().toISOString() }
          setApprovedBooks((prev) => [updatedBook, ...prev])
          onBookApproved(updatedBook)
        }

        toast({
          title: "Success",
          description: `Book ${action}d successfully`,
        })
      } else {
        throw new Error(data.error || `Failed to ${action} book`)
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

  const submitDummyRequest = async () => {
    if (!newBookTitle.trim() || !newBookRequester.trim()) {
      toast({
        title: "Error",
        description: "Book title and requester are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/mobile/books/pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newBookTitle.trim(),
          author: newBookAuthor.trim() || undefined,
          requestedBy: newBookRequester.trim(),
          deviceInfo: {
            platform: "Test Device",
            version: "1.0.0",
            userAgent: "Admin Test",
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Add to pending books list
        setPendingBooks((prev) => [data.book, ...prev])

        // Clear form
        setNewBookTitle("")
        setNewBookAuthor("")
        setNewBookRequester("")

        toast({
          title: "Success",
          description: "Dummy book request submitted successfully",
        })
      } else {
        throw new Error(data.error || "Failed to submit book request")
      }
    } catch (error) {
      console.error("Error submitting dummy request:", error)
      toast({
        title: "Error",
        description: "Failed to submit book request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchPendingBooks()
    fetchApprovedBooks()

    // Poll for new requests every 30 seconds
    const interval = setInterval(() => {
      fetchPendingBooks()
      fetchApprovedBooks()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile App Book Requests
              </CardTitle>
              <CardDescription>Manage book requests from mobile app users</CardDescription>
            </div>
            <Button
              onClick={() => {
                fetchPendingBooks()
                fetchApprovedBooks()
              }}
              disabled={isLoading}
              size="sm"
            >
              Refresh All
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add Dummy Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Test Request
          </CardTitle>
          <CardDescription>Submit a dummy book request to test the approval workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="book-title">Book Title *</Label>
              <Input
                id="book-title"
                placeholder="e.g., The Great Gatsby"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-author">Author (Optional)</Label>
              <Input
                id="book-author"
                placeholder="e.g., F. Scott Fitzgerald"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester">Requester Email *</Label>
              <Input
                id="requester"
                placeholder="e.g., user@example.com"
                value={newBookRequester}
                onChange={(e) => setNewBookRequester(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={submitDummyRequest}
            disabled={isSubmitting || !newBookTitle.trim() || !newBookRequester.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Submit Test Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs for Pending and Approved */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Requests ({pendingBooks.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved Requests ({approvedBooks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>Book requests awaiting admin approval</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading pending requests...</div>
              ) : pendingBooks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending book requests</p>
                  <p className="text-sm">Use the form above to add a test request</p>
                </div>
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
                          Device: {book.deviceInfo.platform || "Unknown"} | Version:{" "}
                          {book.deviceInfo.version || "Unknown"}
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
                          {processingIds.has(book.id) ? "Processing..." : "Approve & Send to Make.com"}
                        </Button>
                        <Button
                          onClick={() => handleBookAction(book.id, "reject")}
                          disabled={processingIds.has(book.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {processingIds.has(book.id) ? "Processing..." : "Reject"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>Book requests that have been approved and sent to Make.com</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedBooks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No approved book requests yet</p>
                  <p className="text-sm">Approved books will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedBooks.map((book) => (
                    <div key={book.id} className="border rounded-lg p-4 space-y-3 bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          {book.author && <p className="text-sm text-gray-600">by {book.author}</p>}
                        </div>
                        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {book.requestedBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Requested: {formatDate(book.timestamp)}
                        </div>
                        {book.processedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved: {formatDate(book.processedAt)}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                        ✓ This book has been approved and sent to Make.com for processing
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
