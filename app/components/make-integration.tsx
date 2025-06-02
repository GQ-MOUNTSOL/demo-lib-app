"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Download, CheckCircle, Bell, Webhook, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcessedBooksDisplay } from "./processed-books-display"

interface SentRequest {
  id: string
  bookTitle: string
  timestamp: string
}

interface ReceivedResult {
  id: string
  book_title: string
  timestamp: string
  data: any
}

export function MakeIntegration() {
  const [bookTitle, setBookTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [processedBooks, setProcessedBooks] = useState<any[]>([])
  const [receivedResults, setReceivedResults] = useState<ReceivedResult[]>([])
  const [activeTab, setActiveTab] = useState("send")
  const { toast } = useToast()
  const [isFetching, setIsFetching] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Replace the problematic comment with:
  // const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/mxx7c2hgingefxsjskc2xyestvoho7rq" // working scenario webhook
  const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/vj9cf3va2p8bmil6ay30j7buwlapufhs" // testing scenario webhook
  const RESULT_WEBHOOK_URL = "https://hook.eu2.make.com/pohurkyqse8t863va7susouvmlv1otmv"
  const LOCAL_WEBHOOK_ENDPOINT = "/api/webhook/results"

  const prompt1 = `Give me the result by acting as a highly skilled literary analyst, deep narrative thinker, and expert in chapter-by-chapter breakdowns by providing an extremely detailed, immersive, and structured summary of around 5000 words. The goal is to make the summary as valuable, comprehensive, and educational as reading the original book.Help readers understand what the book is and why it matters. Then, for each chapter, write full paragraphs (not bullet points) that unpacks all major events, arguments, character developments, and transitions. Include key quotes from the book (using actual text where possible) to provide authenticity and literary richnes for the book`

  const prompt4 = `Act as a book metadata expert, providing comprehensive details on any book title given. When provided with a book name, return structured information covering the following aspects: 1. **Book Title and Subtitle** (if applicable). 2. **Primary Genre** and **Subgenres** – Categorize the book appropriately. 3. **Author Information**: - Full name - Nationality and time period `

  // Poll for new results from our webhook endpoint
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(async () => {
        try {
          // In a real implementation, you might use WebSockets or Server-Sent Events
          // For now, we'll check if there are new results
          const response = await fetch("/api/webhook/results/latest")
          if (response.ok) {
            const newResults = await response.json()
            if (newResults.length > 0) {
              setReceivedResults((prev) => [...newResults, ...prev])

              // Add to processed books
              newResults.forEach((result: any) => {
                if (result.data && isValidBookData(result.data)) {
                  setProcessedBooks((prev) => [
                    ...prev,
                    {
                      id: result.id,
                      ...result.data,
                      timestamp: result.timestamp,
                      status: "completed",
                    },
                  ])

                  toast({
                    title: "New Result Received!",
                    description: `"${result.book_title}" analysis is complete`,
                  })
                }
              })
            }
          }
        } catch (error) {
          console.error("Error checking for new results:", error)
        }
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
  }, [isListening])

  const isValidBookData = (data: any) => {
    return (
      data &&
      (data.book_title || data.title) &&
      (data.author_information?.full_name || data.author) &&
      (data.primary_genre || data.genre)
    )
  }

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
      prompt1: prompt1,
      prompt2: bookTitle.trim(),
      prompt3: `Author of ${bookTitle.trim()}`,
      prompt4: prompt4,
      requestId: requestId,
      timestamp: new Date().toISOString(),
      // Add callback webhook for results
      callback_webhook: window.location.origin + LOCAL_WEBHOOK_ENDPOINT,
      result_webhook: RESULT_WEBHOOK_URL,
    }

    // Add to sent requests list
    const newRequest: SentRequest = {
      id: requestId,
      bookTitle: bookTitle.trim(),
      timestamp: new Date().toISOString(),
    }

    setSentRequests((prev) => [newRequest, ...prev])

    try {
      // Fire-and-forget: don't wait for response
      fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        mode: "cors",
      }).catch((error) => {
        console.error("Fire-and-forget error (ignored):", error)
      })

      // Immediately show success and clear input
      toast({
        title: "Book Sent Successfully",
        description: `"${bookTitle}" has been sent to Make.com for analysis.`,
      })

      setBookTitle("") // Clear input immediately

      // Start listening for results if not already
      if (!isListening) {
        setIsListening(true)
      }
    } catch (error) {
      console.error("Error sending to Make.com:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setSentRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: "error", response: errorMessage } : req)),
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

  const testWithSampleData = () => {
    const sampleData = {
      book_title: "The Wizard of Oz",
      primary_genre: "Children's literature",
      subgenres: ["Fantasy", "Adventure"],
      author_information: {
        full_name: "L. Frank Baum",
        nationality: "American",
        time_period: "1856-1919",
        brief_biography:
          "Lyman Frank Baum was an American author who wrote The Wizard of Oz, a beloved children's book.",
      },
      similar_books: [
        "Alice's Adventures in Wonderland by Lewis Carroll",
        "Peter Pan by J.M. Barrie",
        "The Secret Garden by Frances Hodgson Burnett",
      ],
      famous_reviews: [
        'The New York Times called it "One of the best children\'s books of all time"',
        'The Guardian said, "Baum\'s tale mixes contemporary parody and ancient legend."',
      ],
      multilingual_information: {
        urdu: {
          book_title: "وزارد آف اوز",
          author_name: "ایل فرینک بائوم",
          genre_classification: "بچوں کی ادب",
        },
        arabic: {
          book_title: "ساحر أوز",
          author_name: "إل فرانك بوم",
          genre_classification: "أدب الأطفال",
        },
        german: {
          book_title: "Der Zauberer von Oz",
          author_name: "L. Frank Baum",
          genre_classification: "Kinderliteratur",
        },
        spanish: {
          book_title: "El mago de Oz",
          author_name: "L. Frank Baum",
          genre_classification: "Literatura infantil",
        },
      },
    }

    setProcessedBooks((prev) => [
      ...prev,
      {
        id: "sample-" + Date.now(),
        ...sampleData,
        timestamp: new Date().toISOString(),
        status: "completed",
      },
    ])

    setActiveTab("results")

    toast({
      title: "Sample Data Added",
      description: "Added sample book data to test the display format",
    })
  }

  const fetchFromMongoDB = async () => {
    setIsFetching(true)
    setFetchError(null)

    try {
      console.log("Attempting to fetch from MongoDB via Make.com...")

      // Simplified fetch payload
      const fetchPayload = {
        action: "fetch_all",
        timestamp: new Date().toISOString(),
      }

      console.log("Sending fetch payload:", fetchPayload)

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(fetchPayload),
        mode: "cors",
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Get response text first to see what we're actually receiving
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}${responseText ? ` - ${responseText}` : ""}`
        setFetchError(errorMessage)
        throw new Error(errorMessage)
      }

      let responseData
      try {
        responseData = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.log("Failed to parse JSON, treating as text:", responseText)
        setFetchError("Invalid JSON response from Make.com")
        throw new Error("Invalid JSON response from Make.com")
      }

      console.log("Parsed response data:", responseData)

      let books = []
      if (Array.isArray(responseData)) {
        books = responseData
      } else if (responseData.books && Array.isArray(responseData.books)) {
        books = responseData.books
      } else if (responseData.data && Array.isArray(responseData.data)) {
        books = responseData.data
      } else if (responseData.records && Array.isArray(responseData.records)) {
        books = responseData.records
      } else if (responseData.result && Array.isArray(responseData.result)) {
        books = responseData.result
      } else {
        console.log("Unexpected response format:", responseData)
        setFetchError("Unexpected response format from Make.com")
      }

      console.log("Extracted books:", books)

      setProcessedBooks(books)

      toast({
        title: "Success",
        description: `Fetched ${books.length} processed books from MongoDB`,
      })

      if (books.length > 0) {
        setActiveTab("results")
      } else {
        toast({
          title: "No Books Found",
          description: "No processed books found in MongoDB. Try processing a book first.",
        })
      }
    } catch (error) {
      console.error("Detailed error fetching from MongoDB:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setFetchError(errorMessage)

      toast({
        title: "Error",
        description: "Failed to fetch processed books. Check the debug info below.",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  const testFetchConnection = async () => {
    try {
      const testPayload = {
        action: "test_connection",
        timestamp: new Date().toISOString(),
      }

      console.log("Testing fetch connection with payload:", testPayload)

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(testPayload),
        mode: "cors",
      })

      const responseText = await response.text()
      console.log("Test connection response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      if (response.ok) {
        toast({
          title: "Connection Test Successful",
          description: "Make.com webhook is responding correctly",
        })
      } else {
        toast({
          title: "Connection Test Failed",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Connection test error:", error)
      toast({
        title: "Connection Test Error",
        description: "Failed to connect to Make.com webhook",
        variant: "destructive",
      })
    }
  }

  const testResultWebhook = async () => {
    try {
      const testPayload = {
        book_title: "Test Book",
        primary_genre: "Test Genre",
        author_information: {
          full_name: "Test Author",
        },
        timestamp: new Date().toISOString(),
        test: true,
      }

      const response = await fetch(LOCAL_WEBHOOK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      })

      if (response.ok) {
        toast({
          title: "Webhook Test Successful",
          description: "Result webhook endpoint is working correctly",
        })
      } else {
        throw new Error(`Webhook test failed: ${response.status}`)
      }
    } catch (error) {
      toast({
        title: "Webhook Test Failed",
        description: "Result webhook endpoint is not responding",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Send & History</TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            Results
            {processedBooks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {processedBooks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            Webhooks
            {isListening && <Bell className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Book to Make.com for Analysis</CardTitle>
              <CardDescription>
                Enter a book title to send for automated analysis. Results will be stored in MongoDB and sent back via
                webhook.
              </CardDescription>
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

              <div className="flex gap-2">
                <Button onClick={sendToMake} disabled={isLoading || !bookTitle.trim()} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send for Analysis
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={testWithSampleData}>
                  Test Sample
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Real-time Results:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• Book sent to Make.com for AI analysis</div>
                  <div>• Results automatically sent back via webhook</div>
                  <div>• Real-time notifications when analysis completes</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Bell className="h-3 w-3" />
                    <span>Listening: {isListening ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sent Requests History */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests History</CardTitle>
              <CardDescription>Books that have been sent to Make.com for processing</CardDescription>
            </CardHeader>
            <CardContent>
              {sentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No requests sent yet. Enter a book title above to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">{request.bookTitle}</p>
                          <p className="text-xs text-gray-600">
                            Sent at {new Date(request.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Sent</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fetch Processed Books from MongoDB</CardTitle>
              <CardDescription>
                Retrieve all books that have been processed by Make.com and stored in MongoDB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={fetchFromMongoDB} disabled={isFetching} className="flex-1">
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching from MongoDB...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Fetch All from MongoDB
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={testFetchConnection}>
                  Test Connection
                </Button>
              </div>

              {fetchError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h4 className="font-semibold text-sm text-red-800">Fetch Error</h4>
                  </div>
                  <p className="text-xs text-red-700 mb-2">{fetchError}</p>
                  <div className="text-xs text-red-600">
                    <p className="font-medium">Possible solutions:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Make sure your Make.com scenario has a route for action: "fetch_all"</li>
                      <li>Check that the Router module is configured correctly</li>
                      <li>Verify MongoDB connection in Make.com</li>
                      <li>Test the connection using the "Test Connection" button</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Debug Information:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Webhook URL: {MAKE_WEBHOOK_URL}</div>
                  <div>• Action: fetch_all</div>
                  <div>
                    • Expected response: Array of book objects or {"{"}"data": [books]{"}"}
                  </div>
                  <div>• Check browser console for detailed logs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProcessedBooksDisplay processedBooks={processedBooks} />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Configure webhooks for real-time result notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    Send Webhook
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">For sending books to process</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block break-all">{MAKE_WEBHOOK_URL}</code>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-green-500" />
                    Result Webhook
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">For receiving processed results</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block break-all">{RESULT_WEBHOOK_URL}</code>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Local Webhook Endpoint:</h4>
                <code className="text-xs text-gray-700">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  {LOCAL_WEBHOOK_ENDPOINT}
                </code>
                <p className="text-xs text-gray-600 mt-2">
                  This endpoint receives results from Make.com when processing is complete
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsListening(!isListening)} className="flex-1">
                  <Bell className="h-4 w-4 mr-2" />
                  {isListening ? "Stop Listening" : "Start Listening"}
                </Button>
                <Button variant="outline" onClick={testResultWebhook}>
                  Test Webhook
                </Button>
              </div>

              {receivedResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Recent Results Received:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {receivedResults.map((result) => (
                      <div key={result.id} className="p-2 bg-green-50 rounded text-xs">
                        <span className="font-medium">{result.book_title}</span>
                        <span className="text-gray-600 ml-2">{new Date(result.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
