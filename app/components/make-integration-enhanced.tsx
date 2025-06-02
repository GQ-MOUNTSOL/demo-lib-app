"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Loader2, Download, Database, Cloud } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcessedBooksDisplay } from "./processed-books-display"

interface MakeRequest {
  id: string
  bookTitle: string
  status: "pending" | "processing" | "completed" | "error"
  timestamp: string
  response?: any
  processedData?: any
}

export function MakeIntegrationEnhanced() {
  const [bookTitle, setBookTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [requests, setRequests] = useState<MakeRequest[]>([])
  const [processedBooks, setProcessedBooks] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("send")
  const [fetchMethod, setFetchMethod] = useState<"datastore" | "database" | "immediate">("datastore")
  const { toast } = useToast()

//   const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/mxx7c2hgingefxsjskc2xyestvoho7rq" for working scenario
  const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/vj9cf3va2p8bmil6ay30j7buwlapufhs" // for Testing new scenario


  const sendToMake = async () => {
    if (!bookTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a book title",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const requestId = Date.now().toString()

    const payload = {
      action: "process",
      prompt1: `Act as a highly skilled literary analyst...`, // Your full prompt
      prompt2: bookTitle.trim(),
      prompt3: `Author of ${bookTitle.trim()}`,
      prompt4: `Act as a book metadata expert...`, // Your full prompt
      requestId: requestId,
      timestamp: new Date().toISOString(),
      fetchMethod: fetchMethod, // Tell Make.com how to handle the data
    }

    const newRequest: MakeRequest = {
      id: requestId,
      bookTitle: bookTitle.trim(),
      status: "pending",
      timestamp: new Date().toISOString(),
    }

    setRequests((prev) => [newRequest, ...prev])

    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        mode: "cors",
      })

      let responseData
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
        try {
          responseData = JSON.parse(responseData)
        } catch (e) {
          console.log("Response is not JSON:", responseData)
        }
      }

      if (!response.ok) {
        throw new Error(`Make.com webhook error: ${response.status} - ${response.statusText}`)
      }

      // Check if we got immediate data (fetchMethod: "immediate")
      if (responseData && isValidBookData(responseData)) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "completed", processedData: responseData } : req,
          ),
        )

        setProcessedBooks((prev) => [
          ...prev,
          {
            id: requestId,
            ...responseData,
            timestamp: new Date().toISOString(),
            status: "completed",
          },
        ])

        toast({
          title: "Success!",
          description: `"${bookTitle}" has been processed and is ready to view`,
        })

        setActiveTab("results")
      } else {
        // Data is stored, need to fetch it
        setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: "processing" } : req)))

        toast({
          title: "Processing Started",
          description: `"${bookTitle}" is being analyzed. Use fetch to retrieve when ready.`,
        })

        // Auto-fetch after a delay for stored data
        setTimeout(() => {
          fetchSpecificBook(bookTitle.trim(), requestId)
        }, 5000)
      }

      setBookTitle("")
    } catch (error) {
      console.error("Error sending to Make.com:", error)
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: "error", response: error.message } : req)),
      )

      toast({
        title: "Error",
        description: "Failed to send request to Make.com",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllProcessedBooks = async () => {
    setIsFetching(true)
    try {
      const fetchPayload = {
        action: "fetch",
        requestType: "getAllProcessedBooks",
        fetchMethod: fetchMethod,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(fetchPayload),
        mode: "cors",
      })

      let responseData
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
        try {
          responseData = JSON.parse(responseData)
        } catch (e) {
          console.log("Response is not JSON:", responseData)
          return
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`)
      }

      console.log("Fetched all books:", responseData)

      // Handle different response formats
      let books = []
      if (Array.isArray(responseData)) {
        books = responseData
      } else if (responseData.books && Array.isArray(responseData.books)) {
        books = responseData.books
      } else if (responseData.records && Array.isArray(responseData.records)) {
        // For Data Store responses
        books = responseData.records.map((record: any) => record.value || record)
      } else if (responseData) {
        books = [responseData]
      }

      setProcessedBooks(books)

      toast({
        title: "Success",
        description: `Fetched ${books.length} processed books from Make.com`,
      })

      if (books.length > 0) {
        setActiveTab("results")
      }
    } catch (error) {
      console.error("Error fetching all processed books:", error)
      toast({
        title: "Error",
        description: "Failed to fetch processed books from Make.com",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  const fetchSpecificBook = async (bookTitle: string, requestId?: string) => {
    try {
      const fetchPayload = {
        action: "fetch",
        requestType: "getSpecificBook",
        bookTitle: bookTitle,
        requestId: requestId,
        fetchMethod: fetchMethod,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(fetchPayload),
        mode: "cors",
      })

      let responseData
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
        try {
          responseData = JSON.parse(responseData)
        } catch (e) {
          return null
        }
      }

      if (!response.ok) {
        return null
      }

      // Handle Data Store response format
      if (responseData.value) {
        responseData = responseData.value
      }

      if (isValidBookData(responseData)) {
        // Update request status if we have a requestId
        if (requestId) {
          setRequests((prev) =>
            prev.map((req) =>
              req.id === requestId ? { ...req, status: "completed", processedData: responseData } : req,
            ),
          )
        }

        // Add to processed books
        setProcessedBooks((prev) => {
          const exists = prev.some((book) => book.book_title === bookTitle)
          if (!exists) {
            return [
              ...prev,
              {
                id: requestId || Date.now().toString(),
                ...responseData,
                timestamp: new Date().toISOString(),
                status: "completed",
              },
            ]
          }
          return prev
        })

        toast({
          title: "Book Found!",
          description: `"${bookTitle}" data retrieved successfully`,
        })

        return responseData
      }

      return null
    } catch (error) {
      console.error("Error fetching specific book:", error)
      return null
    }
  }

  const isValidBookData = (data: any) => {
    return (
      data &&
      (data.book_title || data.title) &&
      (data.author_information?.full_name || data.author) &&
      (data.primary_genre || data.genre)
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="fetch">Fetch</TabsTrigger>
          <TabsTrigger value="results">Results ({processedBooks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          {/* Fetch Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Data Storage Method</CardTitle>
              <CardDescription>Choose how Make.com should handle processed data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    fetchMethod === "immediate" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => setFetchMethod("immediate")}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Immediate Return</h3>
                  </div>
                  <p className="text-xs text-gray-600">Return processed data immediately in response</p>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    fetchMethod === "datastore" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => setFetchMethod("datastore")}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Data Store</h3>
                  </div>
                  <p className="text-xs text-gray-600">Store in Make.com Data Store for later retrieval</p>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    fetchMethod === "database" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => setFetchMethod("database")}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Database</h3>
                  </div>
                  <p className="text-xs text-gray-600">Store in PostgreSQL database</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Book for Analysis</CardTitle>
              <CardDescription>Enter a book title to process with AI using the selected storage method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="book-title">Book Title</Label>
                <Input
                  id="book-title"
                  placeholder="e.g., The Wizard of Oz"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && sendToMake()}
                />
              </div>

              <Button onClick={sendToMake} disabled={isLoading || !bookTitle.trim()} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send for Analysis
                  </>
                )}
              </Button>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Selected Method: {fetchMethod}</h4>
                <p className="text-xs text-gray-600">
                  {fetchMethod === "immediate" && "Data will be returned immediately in the response"}
                  {fetchMethod === "datastore" && "Data will be stored in Make.com Data Store for retrieval"}
                  {fetchMethod === "database" && "Data will be stored in your PostgreSQL database"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fetch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fetch Processed Books</CardTitle>
              <CardDescription>Retrieve all books that have been processed and stored by Make.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={fetchAllProcessedBooks} disabled={isFetching} className="w-full">
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching from {fetchMethod}...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch All Processed Books
                  </>
                )}
              </Button>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Fetch Configuration:</h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <div>• Method: {fetchMethod}</div>
                  <div>• Action: fetch</div>
                  <div>• Request Type: getAllProcessedBooks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <ProcessedBooksDisplay processedBooks={processedBooks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
