"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, Smartphone, User, Calendar, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingBook {
  id: string
  title: string
  author?: string
  requestedBy: string
  timestamp: string
  status: "pending" | "approved" | "rejected"
  deviceInfo?: {
    platform: string
    version: string
  }
  processedBy?: string
  processedAt?: string
}

interface MobileBookRequestsProps {
  onBookApproved: (book: PendingBook) => void
}

export function MobileBookRequests({ onBookApproved }: MobileBookRequestsProps) {
  const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([])
  const [approvedBooks, setApprovedBooks] = useState<PendingBook[]>([])
  const [rejectedBooks, setRejectedBooks] = useState<PendingBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("pending")

  // Form for simulating mobile requests
  const [newBookTitle, setNewBookTitle] = useState("")
  const [newBookAuthor, setNewBookAuthor] = useState("")
  const [requestedBy, setRequestedBy] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const fetchPendingBooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/mobile/books/pending")
      const data = await response.json()

      if (data.success) {
        setPendingBooks(data.books || [])
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
        const processedBook = data.book

        // Remove from pending list
        setPendingBooks((prev) => prev.filter((book) => book.id !== bookId))

        // Add to appropriate list
        if (action === "approve") {
          setApprovedBooks((prev) => [...prev, processedBook])
          // Notify parent component to send to Make.com
          onBookApproved(processedBook)
        } else {
          setRejectedBooks((prev) => [...prev, processedBook])
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

  const submitMobileRequest = async () => {
    if (!newBookTitle.trim() || !requestedBy.trim()) {
      toast({
        title: "Error",
        description: "Book title and requester email are required",
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
          requestedBy: requestedBy.trim(),
          deviceInfo: {
            platform: "Web Simulator",
            version: "1.0.0",
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
        setRequestedBy("")

        toast({
          title: "Success",
          description: "Book request submitted successfully",
        })

        // Switch to pending tab to see the new request
        setActiveTab("pending")
      } else {
        throw new Error(data.error || "Failed to submit book request")
      }
    } catch (error) {
      console.error("Error submitting book request:", error)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderBookList = (books: PendingBook[], showActions = false) => {
    if (books.length === 0) {
      return <div className="text-center py-8 text-gray-500">No {activeTab} book requests</div>
    }

    return (
      <div className="space-y-4">
        {books.map((book) => (
          <div key={book.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{book.title}</h3>
                {book.author && <p className="text-sm text-gray-600">by {book.author}</p>}
              </div>
              {getStatusBadge(book.status)}
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
                Device: {book.deviceInfo.platform} | Version: {book.deviceInfo.version}
              </div>
            )}

            {book.processedBy && book.processedAt && (
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                Processed by {book.processedBy} on {formatDate(book.processedAt)}
              </div>
            )}

            {showActions && book.status === "pending" && (
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
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mobile App Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile App Simulator
          </CardTitle>
          <CardDescription>Simulate a book request from your mobile app (for testing purposes)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="requested-by">Requested By (Email) *</Label>
            <Input
              id="requested-by"
              type="email"
              placeholder="e.g., user@example.com"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
            />
          </div>
          <Button
            onClick={submitMobileRequest}
            disabled={isSubmitting || !newBookTitle.trim() || !requestedBy.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Submit Mobile Book Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Mobile Requests Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Book Requests Management
              </CardTitle>
              <CardDescription>Manage book requests from your mobile app</CardDescription>
            </div>
            <Button onClick={fetchPendingBooks} disabled={isLoading} size="sm">
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingBooks.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedBooks.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedBooks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pending Approval</h3>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    {pendingBooks.length} pending
                  </Badge>
                </div>
                {renderBookList(pendingBooks, true)}
              </div>
            </TabsContent>

            <TabsContent value="approved">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Approved & Sent to Make.com</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {approvedBooks.length} approved
                  </Badge>
                </div>
                {renderBookList(approvedBooks)}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Rejected Requests</h3>
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    {rejectedBooks.length} rejected
                  </Badge>
                </div>
                {renderBookList(rejectedBooks)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
